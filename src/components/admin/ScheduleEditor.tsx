import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Loader2, Languages as LanguagesIcon, Check } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Recurrence = "none" | "weekly" | "biweekly" | "monthly";

type ScheduleItem = {
  id: string;
  title: string;
  category: string;
  day: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  language: string;
  registration_required: boolean;
  active: boolean;
  recurrence: Recurrence;
  recurrence_end_date: string | null;
  series_id: string | null;
  translations?: Record<string, Record<string, string>> | null;
};

const REQUIRED_LANGS = ["es", "fa", "ps", "so", "ar"];

const CATEGORIES = [
  "English Language Classes",
  "Life Skills Classes",
  "Community Events",
  "Youth Programs",
  "Health & Wellness",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

const emptyDraft = (): Omit<ScheduleItem, "id"> => ({
  title: "",
  category: CATEGORIES[0],
  day: "Monday",
  date: new Date().toISOString().slice(0, 10),
  start_time: "09:00",
  end_time: "10:00",
  location: "The PLACE",
  description: "",
  language: "English",
  registration_required: false,
  active: true,
  recurrence: "none",
  recurrence_end_date: null,
  series_id: null,
});

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
function dayName(iso: string): string {
  const idx = new Date(iso + "T00:00:00").getDay(); // 0=Sun
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][idx];
}
function generateOccurrenceDates(start: string, end: string, rec: Recurrence): string[] {
  if (rec === "none") return [start];
  const dates: string[] = [];
  let cur = start;
  let i = 0;
  while (cur <= end && i < 520) {
    dates.push(cur);
    if (rec === "weekly") cur = addDays(cur, 7);
    else if (rec === "biweekly") cur = addDays(cur, 14);
    else if (rec === "monthly") cur = addMonths(cur, 1);
    i++;
  }
  return dates;
}

const PAGE_SIZE = 10;

export function ScheduleEditor() {
  const [items, setItems] = useState<ScheduleItem[] | null>(null);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [creating, setCreating] = useState<Omit<ScheduleItem, "id"> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const translateFn = useServerFn(translateRow);

  async function handleTranslate(id: string) {
    setTranslatingId(id);
    try {
      await translateFn({ data: { table: "schedule_items", id } });
      toast.success("Translations generated");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
    } finally {
      setTranslatingId(null);
    }
  }

  function translationStatus(it: ScheduleItem) {
    const tr = it.translations ?? {};
    const present = REQUIRED_LANGS.filter((l) => tr[l] && Object.keys(tr[l]).length > 0).length;
    return { present, total: REQUIRED_LANGS.length, complete: present === REQUIRED_LANGS.length };
  }

  async function load() {
    const { data, error } = await supabase
      .from("schedule_items")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      toast.error("Failed to load schedule");
      return;
    }
    setItems(data as ScheduleItem[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(
    draft: ScheduleItem | Omit<ScheduleItem, "id">,
    scope: "single" | "series" = "single",
  ) {
    setSaving(true);
    try {
      if ("id" in draft) {
        // Editing existing
        if (scope === "series" && draft.series_id) {
          const { id, date, day, series_id, recurrence, recurrence_end_date, translations, ...patch } = draft;
          const { error } = await supabase
            .from("schedule_items")
            .update(patch)
            .eq("series_id", series_id);
          if (error) throw error;
          toast.success("Series updated");
        } else {
          const { id, translations, ...patch } = draft;
          const { error } = await supabase.from("schedule_items").update(patch).eq("id", id);
          if (error) throw error;
          toast.success("Event updated");
        }
        setEditing(null);
      } else {
        // Creating new
        if (draft.recurrence !== "none" && draft.recurrence_end_date) {
          const seriesId = crypto.randomUUID();
          const dates = generateOccurrenceDates(draft.date, draft.recurrence_end_date, draft.recurrence);
          const rows = dates.map((d) => ({
            ...draft,
            date: d,
            day: dayName(d),
            series_id: seriesId,
          }));
          const { error } = await supabase.from("schedule_items").insert(rows);
          if (error) throw error;
          toast.success(`${rows.length} events created`);
        } else {
          const { error } = await supabase.from("schedule_items").insert({ ...draft, series_id: null });
          if (error) throw error;
          toast.success("Event created");
        }
        setCreating(null);
      }
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, scope: "single" | "series" = "single") {
    const target = items?.find((i) => i.id === id);
    if (scope === "series" && target?.series_id) {
      const { error } = await supabase.from("schedule_items").delete().eq("series_id", target.series_id);
      if (error) return toast.error(error.message);
      toast.success("Series deleted");
    } else {
      const { error } = await supabase.from("schedule_items").delete().eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Event deleted");
    }
    setDeleteId(null);
    load();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-primary-deep">Schedule items</h2>
        <Button size="sm" className="rounded-full gap-1.5" onClick={() => setCreating(emptyDraft())}>
          <Plus className="h-4 w-4" />Add event
        </Button>
      </div>
      <div className="overflow-x-auto">
        {items === null ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No events yet.</div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead className="bg-warm">
              <tr>
                {["Title", "Category", "When", "Location", "Status", "Translations"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((it) => {
                const st = translationStatus(it);
                return (
                  <tr key={it.id} className="border-t border-border">
                    <td className="px-4 py-2">{it.title}</td>
                    <td className="px-4 py-2">{it.category}</td>
                    <td className="px-4 py-2">{it.date} · {it.start_time}–{it.end_time}</td>
                    <td className="px-4 py-2">{it.location}</td>
                    <td className="px-4 py-2">{it.active ? "Active" : "Hidden"}</td>
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
                        disabled={translatingId === it.id}
                        onClick={() => handleTranslate(it.id)}
                      >
                        {translatingId === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LanguagesIcon className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(it)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(it.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length > PAGE_SIZE && (() => {
            const totalPages = Math.ceil(items.length / PAGE_SIZE);
            const current = Math.min(page, totalPages);
            return (
              <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, items.length)} of {items.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {current} of {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={current === totalPages} onClick={() => setPage(current + 1)}>Next</Button>
                </div>
              </div>
            );
          })()}
          </>
        )}
      </div>

      <EventDialog
        open={editing !== null}
        title="Edit event"
        value={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={(v) => handleSave(v as ScheduleItem)}
      />
      <EventDialog
        open={creating !== null}
        title="New event"
        value={creating}
        saving={saving}
        onClose={() => setCreating(null)}
        onSave={(v) => handleSave(v)}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
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

function EventDialog<T extends Omit<ScheduleItem, "id"> | ScheduleItem | null>({
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
          <Field label="Title">
            <Input value={draft.title} onChange={(e) => update("title", e.target.value as never)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={draft.category} onValueChange={(v) => update("category", v as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Day of week">
              <Select value={draft.day} onValueChange={(v) => update("day", v as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date">
              <Input type="date" value={draft.date} onChange={(e) => update("date", e.target.value as never)} />
            </Field>
            <Field label="Start">
              <Input type="time" value={draft.start_time} onChange={(e) => update("start_time", e.target.value as never)} />
            </Field>
            <Field label="End">
              <Input type="time" value={draft.end_time} onChange={(e) => update("end_time", e.target.value as never)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <Input value={draft.location} onChange={(e) => update("location", e.target.value as never)} />
            </Field>
            <Field label="Language">
              <Input value={draft.language} onChange={(e) => update("language", e.target.value as never)} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={draft.description} onChange={(e) => update("description", e.target.value as never)} />
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.registration_required} onCheckedChange={(v) => update("registration_required", v as never)} />
              Registration required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.active} onCheckedChange={(v) => update("active", v as never)} />
              Active (visible to public)
            </label>
          </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
