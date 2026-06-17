import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — The PLACE Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("display_name, avatar_url, bio").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setBio(data.bio ?? "");
      }
      setLoading(false);
    });
  }, [user.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      bio: bio || null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-12">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" className="gap-2"><Link to="/admin"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link></Button>
        <Button variant="outline" className="rounded-full" onClick={handleSignOut}>Sign out</Button>
      </div>

      <div className="surface-card p-6 md:p-8 mt-4">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-primary-deep">Your profile</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 mt-1" />
            </div>
            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="h-11 mt-1" placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1" />
            </div>
            <Button type="submit" disabled={saving} className="rounded-full bg-primary hover:bg-primary-deep">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
