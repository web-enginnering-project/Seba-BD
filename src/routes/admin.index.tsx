import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { SERVICE_TYPES } from "@/lib/serviceTypes";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<{ services: number; cities: number; districts: number; pending: number; reports: number; byType: Record<string, number> } | null>(null);

  useEffect(() => {
    (async () => {
      const [services, cities, districts, pending, reports] = await Promise.all([
        supabase.from("services").select("type", { count: "exact" }),
        supabase.from("cities").select("id", { count: "exact", head: true }),
        supabase.from("districts").select("id", { count: "exact", head: true }),
        supabase.from("scraped_pending").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("service_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const byType: Record<string, number> = {};
      (services.data ?? []).forEach((r: any) => { byType[r.type] = (byType[r.type] ?? 0) + 1; });
      setStats({
        services: services.count ?? 0,
        cities: cities.count ?? 0,
        districts: districts.count ?? 0,
        pending: pending.count ?? 0,
        reports: reports.count ?? 0,
        byType,
      });
    })();
  }, []);

  if (!stats) return <Loader2 className="w-6 h-6 animate-spin text-primary" />;

  const tile = (label: string, value: number, accent = "primary") => (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{label}</div>
      <div className="text-3xl font-extrabold" style={{ color: `hsl(var(--${accent}))` }}>{value}</div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Overview of the directory.</p>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {tile("Total services", stats.services)}
        {tile("Cities", stats.cities)}
        {tile("Districts", stats.districts)}
        {tile("Pending scraped", stats.pending, "type-fire")}
        {tile("Open reports", stats.reports, "emergency")}
      </div>
      <div>
        <h2 className="font-bold mb-3">By service type</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {SERVICE_TYPES.map(t => (
            <Card key={t.value} className="p-4">
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div className="text-xl font-bold" style={{ color: `hsl(var(--${t.color}))` }}>{stats.byType[t.value] ?? 0}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
