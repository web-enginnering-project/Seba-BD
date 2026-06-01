import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  reason: z.string().trim().min(5, "Please describe the issue (min 5 chars)").max(500),
  contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

export const ReportDialog = ({
  open, onOpenChange, serviceId, serviceName,
}: { open: boolean; onOpenChange: (v: boolean) => void; serviceId: string; serviceName: string }) => {
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse({ reason, contact_email: email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("service_reports").insert({
      service_id: serviceId,
      reason: parsed.data.reason,
      contact_email: parsed.data.contact_email || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Could not submit report"); return; }
    toast.success("Thanks! Admins will review.");
    setReason(""); setEmail(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report incorrect info</DialogTitle>
          <DialogDescription>{serviceName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">What's wrong?</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={4}
              placeholder="Wrong phone number, closed branch, etc." />
          </div>
          <div>
            <Label htmlFor="email">Your email (optional)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </div>
          <Button className="w-full" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
