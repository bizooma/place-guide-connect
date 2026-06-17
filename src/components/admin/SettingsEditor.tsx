import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SettingsEditor() {
  const [supportEmail, setSupportEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "support_email")
        .maybeSingle();
      setLoading(false);
      if (error) {
        toast.error("Failed to load settings", { description: error.message });
        return;
      }
      const v = data?.value;
      setSupportEmail(typeof v === "string" ? v : "");
    })();
  }, []);

  async function saveSupportEmail() {
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: "support_email", value: supportEmail, updated_by: userRes.user?.id ?? null },
        { onConflict: "key" },
      );
    setSaving(false);
    if (error) {
      toast.error("Failed to save", { description: error.message });
      return;
    }
    toast.success("Support email saved");
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h2 className="font-semibold text-primary-deep">Support email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The email address shown to users who need help. Visible to everyone.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <Label htmlFor="support-email" className="sr-only">Support email</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="support@example.org"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button
            onClick={saveSupportEmail}
            disabled={saving || loading}
            className="rounded-full gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </section>
    </div>
  );
}
