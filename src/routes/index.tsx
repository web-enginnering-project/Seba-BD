import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EmergencyBar } from "@/components/EmergencyBar";
import { ServiceCard, type ServiceRow } from "@/components/ServiceCard";
import { SERVICE_TYPES, type ServiceType } from "@/lib/serviceTypes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SebaBD — Bangladesh Emergency & Service Directory" },
      { name: "description", content: "Find hospitals, police, fire service, RAB and army contacts across every district in Bangladesh." },
    ],
  }),
  component: Index,
});

type District = { id: string; name: string };

function Index() {
  const [query, setQuery] = useState("");
  const [districtId, setDistrictId] = useState<string>("");
  const [activeTypes, setActiveTypes] = useState<Set<ServiceType>>(new Set());
  const [districts, setDistricts] = useState<District[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [d, s] = await Promise.all([
        supabase.from("districts").select("id, name").order("name"),
        supabase.from("services").select("id, name, type, address, phone, latitude, longitude, city:cities(name, district:districts(name))").eq("is_published", true).order("name"),
      ]);
      if (d.data) setDistricts(d.data);
      if (s.data) setServices(s.data as any);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter(s => {
      if (activeTypes.size && !activeTypes.has(s.type)) return false;
      if (districtId) {
        const dn = districts.find(d => d.id === districtId)?.name;
        if (s.city?.district?.name !== dn) return false;
      }
      if (q) {
        const hay = `${s.name} ${s.address ?? ''} ${s.city?.name ?? ''} ${s.city?.district?.name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [services, query, districtId, activeTypes, districts]);

  const toggleType = (t: ServiceType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const grouped = SERVICE_TYPES.map(meta => ({
    meta,
    items: filtered.filter(f => f.type === meta.value),
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EmergencyBar />
      <SiteHeader />

      <section className="bg-hero text-primary-foreground">
        <div className="container py-12 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70 mb-3">
            বাংলাদেশ জনসেবা ডিরেক্টরি
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-balance max-w-3xl mb-4">
            Every emergency contact in Bangladesh — one search away.
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/85 max-w-2xl mb-8 text-balance">
            Hospitals, police stations, fire service, RAB and army contacts for every district. Free, fast, mobile-friendly.
          </p>

          <div className="bg-background rounded-2xl p-3 shadow-elegant flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city or district..."
                className="pl-10 h-12 border-0 bg-muted/50 focus-visible:ring-1"
              />
            </div>
            <select
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="h-12 px-4 rounded-md bg-muted/50 text-foreground text-sm font-medium border-0 focus:outline-none focus:ring-1 focus:ring-ring sm:w-56"
            >
              <option value="">All districts</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background sticky top-16 z-30">
        <div className="container py-3 flex gap-2 overflow-x-auto">
          <Button variant={activeTypes.size === 0 ? "default" : "outline"} size="sm" onClick={() => setActiveTypes(new Set())}>
            All services
          </Button>
          {SERVICE_TYPES.map(t => {
            const active = activeTypes.has(t.value);
            return (
              <Button
                key={t.value}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => toggleType(t.value)}
                className={cn("whitespace-nowrap")}
                style={active ? { backgroundColor: `hsl(var(--${t.color}))`, borderColor: `hsl(var(--${t.color}))` } : undefined}
              >
                <span className="mr-1">{t.emoji}</span> {t.label}
              </Button>
            );
          })}
        </div>
      </section>

      <main className="container py-8 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium text-foreground mb-1">No services found</p>
            <p className="text-sm">Try a different search or clear your filters.</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'service' : 'services'}
            </div>
            {grouped.map(({ meta, items }) => (
              <div key={meta.value}>
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                  <span className="text-xs font-medium text-muted-foreground">({items.length})</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map(s => <ServiceCard key={s.id} service={s} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
