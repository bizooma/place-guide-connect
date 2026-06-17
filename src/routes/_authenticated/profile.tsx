import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UserCircle, ArrowLeft, Upload, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPwd, setUpdatingPwd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
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
      avatar_url: avatarUrl,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: url });
    setUploading(false);
    if (updErr) toast.error(updErr.message);
    else {
      setAvatarUrl(url);
      toast.success("Avatar updated");
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setUpdatingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPwd(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-12 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" className="gap-2"><Link to="/admin"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link></Button>
        <Button variant="outline" className="rounded-full" onClick={handleSignOut}>Sign out</Button>
      </div>

      <div className="surface-card p-6 md:p-8">
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
              <Label>Avatar</Label>
              <div className="mt-2 flex items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border border-border" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-warm border border-border flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <Button type="button" variant="outline" className="rounded-full gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload image"}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 mt-1" />
            </div>
            <Button type="submit" disabled={saving} className="rounded-full bg-primary hover:bg-primary-deep">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </div>

      <div className="surface-card p-6 md:p-8">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-primary-deep">Change password</h2>
        </div>
        <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="new-pwd">New password</Label>
            <Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 mt-1" autoComplete="new-password" required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirm-pwd">Confirm new password</Label>
            <Input id="confirm-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 mt-1" autoComplete="new-password" required minLength={6} />
          </div>
          <Button type="submit" disabled={updatingPwd} className="rounded-full bg-primary hover:bg-primary-deep">
            {updatingPwd ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
