import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — SebaBD Admin" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const creds = { email: parsed.data.email, password: parsed.data.password };
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword(creds);
      setBusy(false);
      if (error) {
        if (error.status === 400 && error.code === "email_not_confirmed") {
          return toast.error("Email not confirmed. Please check your inbox and confirm your email before signing in.");
        }
        return toast.error(error.message);
      }
      navigate({ to: "/admin", replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({
        ...creds,
        options: { emailRedirectTo: window.location.origin + "/auth" },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (data.session) {
        navigate({ to: "/admin", replace: true });
      } else {
        toast.success("Account created. Check your email to confirm it before signing in.");
        setMode("login");
      }
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-hero px-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <Link to="/" className="flex items-center gap-2 mb-6 text-foreground">
          <div className="w-10 h-10 rounded-xl bg-hero grid place-items-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold">SebaBD Admin</div>
            <div className="text-xs text-muted-foreground">Restricted access</div>
          </div>
        </Link>
        <h1 className="text-2xl font-bold mb-1">{mode === "login" ? "Sign in" : "Create admin account"}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The first signup becomes admin automatically. Later signups default to <code>user</code>.
          If your email address requires verification, you will need to confirm it before signing in.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button type="button" onClick={() => setMode(m => m === "login" ? "signup" : "login")}
          className="w-full text-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-smooth">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
