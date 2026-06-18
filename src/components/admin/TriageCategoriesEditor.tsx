import { useEffect, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type TriageRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export function TriageCategoriesEditor() {
  const [rows, setRows] = useState<TriageRow[] | null>(null);
  const [editing, setEditing] = useState<TriageRow | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("triage_categories")
      .select("id,slug,title,description,icon,sort_order,active")
      .order("sort_order");
    if (error) return toast.error("Failed to load help choices");
    setRows((data ?? []) as TriageRow[]);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(draft: TriageRow) {
    setSaving(true);
    const { error } = await supabase
      .from("triage_categories")
      .update({
        title: draft.title,
        description: draft.description,
        sort_order: draft.sort_order,
        active: draft.active,
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Help choice updated");
    setEditing(null);
    load();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-primary-deep">Help choices (triage categories)</h2>
      </div>
      <div className="overflow-x-auto">
        {rows === null ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-warm">
              <tr>
                {["Order", "Title", "Description", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2">{r.sort_order}</td>
                  <td className="px-4 py-2">{r.title}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.description}</td>
                  <td className="px-4 py-2">{r.active ? "Active" : "Hidden"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EditDialog
        open={editing !== null}
        value={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </section>
  );
}

function EditDialog({
  open,
  value,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  value: TriageRow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (v: TriageRow) => void;
}) {
  const [draft, setDraft] = useState<TriageRow | null>(null);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  if (!draft) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit help choice</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Order</Label>
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm pb-2">
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
              Active (visible to public)
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            The slug "{draft.slug}" determines which question flow runs after a user picks this choice. It can't be edited here.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={saving || !draft.title}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
