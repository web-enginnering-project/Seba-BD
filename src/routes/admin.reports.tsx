import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: Reports,
});

type Row = { id: string; reason: string; contact_email: string | null; created_at: string; status: string; service: { name: string } | null };

function Reports() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("service_reports")
      .select("id, reason, contact_email, created_at, status, service:services(name)")
      .eq("status", "pending").order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => {
    await supabase.from("service_reports").update({ status: "resolved" }).eq("id", id);
    toast.success("Marked resolved");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">User reports</h1>
        <p className="text-muted-foreground">Reports of incorrect information.</p>
      </div>
      {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No pending reports.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <Card key={r.id} className="p-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="font-semibold">{r.service?.name ?? "(deleted service)"}</div>
                <div className="text-sm text-foreground mt-1">{r.reason}</div>
                <div className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}{r.contact_email && ` · ${r.contact_email}`}</div>
              </div>
              <Button size="sm" onClick={() => resolve(r.id)}><Check className="w-4 h-4" /> Resolve</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
