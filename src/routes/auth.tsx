import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — The PLACE Online" },
      { name: "description", content: "Sign in to manage The PLACE Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="surface-card p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-primary-deep">Admin sign in</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to access your dashboard and profile.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 mt-1" required />
          </div>
          <div>
            <Label htmlFor="pwd">Password</Label>
            <Input id="pwd" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 mt-1" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-full bg-primary hover:bg-primary-deep">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
