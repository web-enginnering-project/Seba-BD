import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, X, Download } from "lucide-react";
import { toast } from "sonner";
import { getTypeMeta } from "@/lib/serviceTypes";
import { extractFromMaps } from "@/lib/mapsExtract.functions";

export const Route = createFileRoute("/admin/pending")({
  component: Pending,
});

type Row = {
  id: string; name: string; type: any; address: string | null; phone: string | null;
  district_name: string | null; city_name: string | null; source_url: string | null; status: string; created_at: string;
};

function Pending() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const runExtract = useServerFn(extractFromMaps);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("scraped_pending").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const extract = async () => {
    setExtracting(true);
    toast.info("Extracting from Google Maps — this may take a few minutes…");
    try {
      const res = await runExtract({ data: {} });
      toast.success(`Added ${res.inserted} new entries (scanned ${res.scanned} across ${res.districts} districts)`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExtracting(false);
    }
  };

  const approve = async (r: Row) => {
    let { data: dist } = await supabase.from("districts").select("id").eq("name", r.district_name ?? "").maybeSingle();
    if (!dist && r.district_name) {
      const ins = await supabase.from("districts").insert({ name: r.district_name }).select("id").single();
      dist = ins.data;
    }
    if (!dist) return toast.error("Missing district");
    let { data: city } = await supabase.from("cities").select("id").eq("district_id", dist.id).eq("name", r.city_name ?? "").maybeSingle();
    if (!city && r.city_name) {
      const ins = await supabase.from("cities").insert({ district_id: dist.id, name: r.city_name }).select("id").single();
      city = ins.data;
    }
    if (!city) return toast.error("Missing city");
    const { error } = await supabase.from("services").insert({
      city_id: city.id, type: r.type, name: r.name, address: r.address, phone: r.phone, is_published: true,
    });
    if (error) return toast.error(error.message);
    await supabase.from("scraped_pending").update({ status: "approved" }).eq("id", r.id);
    toast.success("Approved & published");
    load();
  };
  const reject = async (id: string) => {
    await supabase.from("scraped_pending").update({ status: "rejected" }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Scraped queue</h1>
          <p className="text-muted-foreground">Review entries before publishing.</p>
        </div>
        <Button onClick={extract} disabled={extracting}>
          {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Extract from Google Maps (all districts)
        </Button>
      </div>
      {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No pending entries.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const meta = getTypeMeta(r.type);
            return (
              <Card key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `hsl(var(--${meta.color}) / 0.1)`, color: `hsl(var(--${meta.color}))` }}>{meta.emoji} {meta.label}</span>
                    <span className="text-xs text-muted-foreground">{r.city_name}, {r.district_name}</span>
                  </div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-muted-foreground">{r.address} · {r.phone}</div>
                  {r.source_url && <a href={r.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">source</a>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(r)}><Check className="w-4 h-4" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r.id)}><X className="w-4 h-4" /> Reject</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
