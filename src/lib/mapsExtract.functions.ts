import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type SvcType = "hospital" | "police" | "fire" | "rab" | "army" | "pouroshova";

const QUERIES: { type: SvcType; q: (d: string) => string }[] = [
  { type: "hospital",   q: (d) => `hospitals in ${d}, Bangladesh` },
  { type: "police",     q: (d) => `police station in ${d}, Bangladesh` },
  { type: "fire",       q: (d) => `fire service station in ${d}, Bangladesh` },
  { type: "rab",        q: (d) => `RAB office in ${d}, Bangladesh` },
  { type: "army",       q: (d) => `Bangladesh Army cantonment in ${d}` },
  { type: "pouroshova", q: (d) => `pouroshova municipality office in ${d}, Bangladesh` },
];

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

async function searchText(textQuery: string) {
  const gmKey = process.env.VITE_GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!gmKey) throw new Error("Missing VITE_GOOGLE_MAPS_BROWSER_KEY or GOOGLE_MAPS_API_KEY");

  const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      "X-Connection-Api-Key": gmKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.location,places.googleMapsUri",
    },
    body: JSON.stringify({ textQuery, regionCode: "BD", pageSize: 20 }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Places searchText ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      location?: { latitude: number; longitude: number };
      googleMapsUri?: string;
    }>;
  };
}

export const extractFromMaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        districtIds: z.array(z.string().uuid()).optional(),
        types: z.array(z.enum(["hospital", "police", "fire", "rab", "army", "pouroshova"])).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");

    let q = supabaseAdmin.from("districts").select("id,name");
    if (data.districtIds?.length) q = q.in("id", data.districtIds);
    const { data: districts, error: dErr } = await q;
    if (dErr) throw new Error(dErr.message);
    if (!districts?.length) return { inserted: 0, scanned: 0, districts: 0 };

    const queries = QUERIES.filter((x) => !data.types?.length || data.types.includes(x.type));

    let inserted = 0;
    let scanned = 0;

    for (const dist of districts) {
      for (const { type, q: build } of queries) {
        try {
          const result = await searchText(build(dist.name));
          const places = result.places ?? [];
          scanned += places.length;
          if (!places.length) continue;

          const rows = places.map((p) => ({
            name: p.displayName?.text ?? "Unknown",
            type,
            address: p.formattedAddress ?? null,
            phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
            district_name: dist.name,
            city_name: dist.name,
            source_url: p.googleMapsUri ?? null,
            status: "pending",
            raw: p as unknown as never,
          }));

          // Dedup against existing pending+approved by name+district
          const names = rows.map((r) => r.name);
          const { data: existing } = await supabaseAdmin
            .from("scraped_pending")
            .select("name")
            .eq("district_name", dist.name)
            .in("name", names);
          const existingNames = new Set((existing ?? []).map((e) => e.name));

          const { data: existingSvc } = await supabaseAdmin
            .from("services")
            .select("name")
            .in("name", names);
          (existingSvc ?? []).forEach((s) => existingNames.add(s.name));

          const fresh = rows.filter((r) => !existingNames.has(r.name));
          if (!fresh.length) continue;

          const { error: insErr } = await supabaseAdmin.from("scraped_pending").insert(fresh);
          if (insErr) {
            console.error("insert failed", insErr.message);
            continue;
          }
          inserted += fresh.length;
        } catch (e) {
          console.error(`extract ${dist.name}/${type} failed:`, (e as Error).message);
        }
      }
    }
    return { inserted, scanned, districts: districts.length };
  });
