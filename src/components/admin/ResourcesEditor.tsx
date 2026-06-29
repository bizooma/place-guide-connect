import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, Loader2, Languages as LanguagesIcon, Check, Upload, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { translateRow } from "@/lib/translate.functions";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Resource = {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  languages: string[];
  hours: string | null;
  eligibility: string | null;
  cost: string;
  tags: string[];
  active: boolean;
  sort_order: number;
  translations?: Record<string, Record<string, string>> | null;
};

const REQUIRED_LANGS = ["es", "fa", "ps", "so", "ar"];

const CATEGORIES = [
  "Food",
  "Housing",
  "Jobs",
  "Legal Help",
  "Immigration Help",
  "Government Services",
  "Transportation",
];

const emptyDraft = (): Omit<Resource, "id"> => ({
  name: "",
  category: CATEGORIES[0],
  description: "",
  phone: "",
  website: "",
  address: "",
  languages: ["English"],
  hours: "",
  eligibility: "",
  cost: "Free",
  tags: [],
  active: true,
  sort_order: 0,
});

export function ResourcesEditor() {
  const [items, setItems] = useState<Resource[] | null>(null);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [creating, setCreating] = useState<Omit<Resource, "id"> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const translateFn = useServerFn(translateRow);

  async function load() {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) return toast.error("Failed to load resources");
    setItems((data ?? []) as Resource[]);
  }

  useEffect(() => { load(); }, []);

  function translationStatus(r: Resource) {
    const tr = r.translations ?? {};
    const present = REQUIRED_LANGS.filter((l) => tr[l] && Object.keys(tr[l]).length > 0).length;
    return { present, total: REQUIRED_LANGS.length, complete: present === REQUIRED_LANGS.length };
  }

  async function handleTranslate(id: string) {
    setTranslatingId(id);
    try {
      await translateFn({ data: { table: "resources", id } });
      toast.success("Translations generated");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
    } finally {
      setTranslatingId(null);
    }
  }

  async function translateAllMissing() {
    if (!items) return;
    const missing = items.filter((r) => !translationStatus(r).complete);
    if (missing.length === 0) return toast.info("Everything is already translated");
    setBulk(true);
    let ok = 0;
    for (const r of missing) {
      try {
        await translateFn({ data: { table: "resources", id: r.id } });
        ok++;
      } catch (e: any) {
        toast.error(`${r.name}: ${e?.message ?? "failed"}`);
      }
    }
    setBulk(false);
    toast.success(`Translated ${ok} of ${missing.length}`);
    load();
  }

  async function handleSave(draft: Resource | Omit<Resource, "id">) {
    setSaving(true);
    const payload = {
      ...draft,
      phone: draft.phone || null,
      website: draft.website || null,
      address: draft.address || null,
      hours: draft.hours || null,
      eligibility: draft.eligibility || null,
    };
    if ("id" in draft) {
      const { id, translations, ...patch } = payload as Resource;
      const { error } = await supabase.from("resources").update(patch).eq("id", id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Resource updated");
      setEditing(null);
    } else {
      const { translations, ...insert } = payload as Omit<Resource, "id">;
      const { error } = await supabase.from("resources").insert(insert);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Resource created");
      setCreating(null);
    }
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Resource deleted");
    setDeleteId(null);
    load();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border gap-2 flex-wrap">
        <h2 className="font-semibold text-primary-deep">Resources</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-full gap-1.5" disabled={bulk || !items} onClick={translateAllMissing}>
            {bulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <LanguagesIcon className="h-4 w-4" />}
            Translate all missing
          </Button>
          <Button size="sm" className="rounded-full gap-1.5" onClick={() => setCreating(emptyDraft())}>
            <Plus className="h-4 w-4" />Add resource
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {items === null ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No resources yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-warm">
              <tr>
                {["Name", "Category", "Phone", "Languages", "Status", "Translations"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const st = translationStatus(r);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.category}</td>
                    <td className="px-4 py-2">{r.phone ?? "—"}</td>
                    <td className="px-4 py-2">{(r.languages ?? []).join(", ")}</td>
                    <td className="px-4 py-2">{r.active ? "Active" : "Hidden"}</td>
                    <td className="px-4 py-2">
                      {st.complete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          <Check className="h-3 w-3" />All {st.total}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {st.present}/{st.total}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Generate translations"
                        disabled={translatingId === r.id}
                        onClick={() => handleTranslate(r.id)}
                      >
                        {translatingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LanguagesIcon className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ResourceDialog
        open={editing !== null}
        title="Edit resource"
        value={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={(v) => handleSave(v as Resource)}
      />
      <ResourceDialog
        open={creating !== null}
        title="New resource"
        value={creating}
        saving={saving}
        onClose={() => setCreating(null)}
        onSave={(v) => handleSave(v)}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ResourceDialog<T extends Omit<Resource, "id"> | Resource | null>({
  open,
  title,
  value,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  value: T;
  saving: boolean;
  onClose: () => void;
  onSave: (v: NonNullable<T>) => void;
}) {
  const [draft, setDraft] = useState<NonNullable<T> | null>(null);

  useEffect(() => {
    if (value) setDraft(value as NonNullable<T>);
  }, [value]);

  if (!draft) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const update = <K extends keyof NonNullable<T>>(key: K, v: NonNullable<T>[K]) =>
    setDraft({ ...draft, [key]: v });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => update("name", e.target.value as never)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Input list="resource-categories" value={draft.category} onChange={(e) => update("category", e.target.value as never)} />
              <datalist id="resource-categories">
                {CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Cost">
              <Input value={draft.cost} onChange={(e) => update("cost", e.target.value as never)} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={draft.description} onChange={(e) => update("description", e.target.value as never)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input value={draft.phone ?? ""} onChange={(e) => update("phone", e.target.value as never)} />
            </Field>
            <Field label="Website">
              <Input value={draft.website ?? ""} onChange={(e) => update("website", e.target.value as never)} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={draft.address ?? ""} onChange={(e) => update("address", e.target.value as never)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hours">
              <Input value={draft.hours ?? ""} onChange={(e) => update("hours", e.target.value as never)} />
            </Field>
            <Field label="Eligibility">
              <Input value={draft.eligibility ?? ""} onChange={(e) => update("eligibility", e.target.value as never)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Languages (comma separated)">
              <Input
                value={(draft.languages ?? []).join(", ")}
                onChange={(e) => update("languages", e.target.value.split(",").map((s) => s.trim()).filter(Boolean) as never)}
              />
            </Field>
            <Field label="Tags (comma separated)">
              <Input
                value={(draft.tags ?? []).join(", ")}
                onChange={(e) => update("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean) as never)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <Field label="Sort order">
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) => update("sort_order", (Number(e.target.value) || 0) as never)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm pb-2">
              <Switch checked={draft.active} onCheckedChange={(v) => update("active", v as never)} />
              Active (visible to public)
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={saving || !draft.name || !draft.category || !draft.description}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
