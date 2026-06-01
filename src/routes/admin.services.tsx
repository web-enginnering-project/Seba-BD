import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { SERVICE_TYPES, type ServiceType, getTypeMeta } from "@/lib/serviceTypes";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/admin/services")({
  component: Services,
});

type City = { id: string; name: string; district: { name: string } | null };
type Row = {
  id: string; name: string; type: ServiceType; address: string | null; phone: string | null;
  is_published: boolean; city_id: string; city: { name: string } | null;
};

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(['hospital', 'police', 'fire', 'rab', 'army', 'pouroshova']),
  city_id: z.string().uuid("Pick a city"),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(50).optional(),
  is_published: z.boolean(),
});

const empty = { name: "", type: "hospital" as ServiceType, city_id: "", address: "", phone: "", is_published: true };

function Services() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from("services").select("id, name, type, address, phone, is_published, city_id, city:cities(name)").order("name"),
      supabase.from("cities").select("id, name, district:districts(name)").order("name"),
    ]);
    setRows((s.data as any) ?? []);
    setCities((c.data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({ name: r.name, type: r.type, city_id: r.city_id, address: r.address ?? "", phone: r.phone ?? "", is_published: r.is_published });
    setOpen(true);
  };

  const save = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const d = parsed.data;
    const payload = {
      name: d.name, type: d.type, city_id: d.city_id, is_published: d.is_published,
      address: d.address || null, phone: d.phone || null,
    };
    const { error } = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Created");
    setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const filtered = rows.filter(r => !search || `${r.name} ${r.address ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Services</h1>
          <p className="text-muted-foreground">Add, edit and publish directory entries.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> New service</Button>
      </div>
      <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">City</th>
                <th className="p-3 font-semibold">Phone</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const meta = getTypeMeta(r.type);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `hsl(var(--${meta.color}) / 0.1)`, color: `hsl(var(--${meta.color}))` }}>{meta.emoji} {meta.label}</span></td>
                    <td className="p-3 text-muted-foreground">{r.city?.name}</td>
                    <td className="p-3 tabular-nums">{r.phone ?? '—'}</td>
                    <td className="p-3">{r.is_published ? <span className="text-primary font-semibold">Published</span> : <span className="text-muted-foreground">Hidden</span>}</td>
                    <td className="p-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No services yet. Click "New service" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} service</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ServiceType })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label>City</Label>
                <select value={form.city_id} onChange={e => setForm({ ...form, city_id: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">Select a city</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}{c.district ? `, ${c.district.name}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              Published
            </label>
            <Button onClick={save} className="w-full">{editing ? "Update" : "Create"}</Button>
            {cities.length === 0 && (
              <p className="text-xs text-muted-foreground">No cities yet. Add a district and city directly in the backend, or via the scraped queue.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
