import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, Loader2, Languages as LanguagesIcon, Check, Repeat, Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";
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

type Recurrence = "none" | "weekly" | "weekdays" | "biweekly" | "monthly";

type ScheduleItem = {
  id: string;
  title: string;
  category: string;
  day: string;
  date: string;
  start_time: string;
  end_time: string;
  start_time_2: string | null;
  end_time_2: string | null;
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
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

// Timezone-safe date helpers. All schedule dates are calendar dates ("YYYY-MM-DD")
// with no timezone semantics. We must NEVER round-trip through Date.toISOString(),
// which converts to UTC and can shift the day in non-UTC timezones.
function todayISOLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight, no UTC conversion
}
function toISOLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptyDraft = (): Omit<ScheduleItem, "id"> => ({
  title: "",
  category: CATEGORIES[0],
  day: "Monday",
  date: todayISOLocal(),
  start_time: "09:00",
  end_time: "10:00",
  start_time_2: null,
  end_time_2: null,
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
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISOLocal(d);
}
function addMonths(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISOLocal(d);
}
function dayName(iso: string): string {
  const idx = fromISO(iso).getDay(); // 0=Sun
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][idx];
}

function daysBetween(a: string, b: string): number {
  const start = fromISO(b).getTime();
  const end = fromISO(a).getTime();
  return Math.round((end - start) / 86_400_000);
}


function normalizeDraftDay<T extends { date: string; day: string }>(draft: T): T {
  return { ...draft, day: dayName(draft.date) };
}

function generateOccurrenceDates(start: string, end: string, rec: Recurrence): string[] {
  if (rec === "none") return [start];
  const dates: string[] = [];
  let cur = start;
  let i = 0;
  while (cur <= end && i < 520) {
    if (rec === "weekdays") {
      const dow = new Date(cur + "T00:00:00").getDay();
      if (dow !== 0 && dow !== 6) dates.push(cur);
      cur = addDays(cur, 1);
    } else {
      dates.push(cur);
      if (rec === "weekly") cur = addDays(cur, 7);
      else if (rec === "biweekly") cur = addDays(cur, 14);
      else if (rec === "monthly") cur = addMonths(cur, 1);
    }
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
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
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

  async function handleTranslateAll() {
    if (!items) return;
    const targets = items.filter((it) => !translationStatus(it).complete);
    if (targets.length === 0) {
      toast.success("All events are already translated");
      return;
    }
    setBulkTranslating(true);
    setBulkProgress({ done: 0, total: targets.length });
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      try {
        await translateFn({ data: { table: "schedule_items", id: targets[i].id } });
      } catch {
        failed++;
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    setBulkTranslating(false);
    if (failed === 0) toast.success(`Translated ${targets.length} event${targets.length === 1 ? "" : "s"}`);
    else toast.error(`Translated ${targets.length - failed}/${targets.length}; ${failed} failed`);
    load();
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
          const original = items?.find((item) => item.id === draft.id);
          const seriesItems = (items ?? []).filter((item) => item.series_id === draft.series_id);
          const { id, date, day, series_id, recurrence, recurrence_end_date, translations, ...patch } = normalizeDraftDay(draft);
          if (!series_id) throw new Error("Missing recurring series ID");
          const dateDelta = original ? daysBetween(date, original.date) : 0;

          if (dateDelta !== 0 && seriesItems.length > 0) {
            for (const item of seriesItems) {
              const nextDate = addDays(item.date, dateDelta);
              const { error } = await supabase
                .from("schedule_items")
                .update({ ...patch, date: nextDate, day: dayName(nextDate) })
                .eq("id", item.id);
              if (error) throw error;
            }
          } else {
            const { error } = await supabase
              .from("schedule_items")
              .update(patch)
              .eq("series_id", series_id);
            if (error) throw error;
          }
          toast.success("Series updated");
        } else {
          const { id, translations, ...patch } = normalizeDraftDay(draft);
          const { error } = await supabase.from("schedule_items").update(patch).eq("id", id);
          if (error) throw error;
          toast.success("Event updated");
        }
        setEditing(null);
      } else {
        // Creating new
        const normalizedDraft = normalizeDraftDay(draft);
        if (normalizedDraft.recurrence !== "none" && normalizedDraft.recurrence_end_date) {
          const seriesId = crypto.randomUUID();
          const dates = generateOccurrenceDates(normalizedDraft.date, normalizedDraft.recurrence_end_date, normalizedDraft.recurrence);
          const rows = dates.map((d) => ({
            ...normalizedDraft,
            date: d,
            day: dayName(d),
            series_id: seriesId,
          }));
          const { error } = await supabase.from("schedule_items").insert(rows);
          if (error) throw error;
          toast.success(`${rows.length} events created`);
        } else {
          const { error } = await supabase.from("schedule_items").insert({ ...normalizedDraft, series_id: null });
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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            disabled={bulkTranslating || !items || items.length === 0}
            onClick={handleTranslateAll}
            title="Generate translations for every event missing them"
          >
            {bulkTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating {bulkProgress.done}/{bulkProgress.total}…
              </>
            ) : (
              <>
                <LanguagesIcon className="h-4 w-4" />
                Translate all
              </>
            )}
          </Button>
          <Button size="sm" className="rounded-full gap-1.5" onClick={() => setCreating(emptyDraft())}>
            <Plus className="h-4 w-4" />Add event
          </Button>
        </div>
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
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span>{it.title}</span>
                        {it.series_id && (
                          <span title="Recurring event" className="inline-flex items-center text-muted-foreground">
                            <Repeat className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
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
        onSave={(v, scope) => { void handleSave(v as ScheduleItem, scope); }}
      />
      <EventDialog
        open={creating !== null}
        title="New event"
        value={creating}
        saving={saving}
        onClose={() => setCreating(null)}
        onSave={(v) => { void handleSave(v); }}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              {items?.find((i) => i.id === deleteId)?.series_id
                ? "This event is part of a recurring series. Choose what to delete."
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-wrap gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {items?.find((i) => i.id === deleteId)?.series_id && (
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId, "series")}>
                Delete entire series
              </AlertDialogAction>
            )}
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId, "single")}>
              {items?.find((i) => i.id === deleteId)?.series_id ? "Delete this event only" : "Delete"}
            </AlertDialogAction>
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
  onSave: (v: NonNullable<T>, scope: "single" | "series") => void;
}) {
  const [draft, setDraft] = useState<NonNullable<T> | null>(null);
  const [scope, setScope] = useState<"single" | "series">("single");

  useEffect(() => {
    if (value) {
      setDraft(value as NonNullable<T>);
      setScope("single");
    }
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

  const isExisting = "id" in (draft as any);
  const isPartOfSeries = isExisting && Boolean((draft as ScheduleItem).series_id);
  const isNew = !isExisting;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {isPartOfSeries && (
            <div className="rounded-md border border-border bg-warm/50 p-3 text-sm">
              <p className="font-medium mb-2">This event is part of a recurring series</p>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "single"}
                    onChange={() => setScope("single")}
                  />
                  Edit this event only
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "series"}
                    onChange={() => setScope("series")}
                  />
                  Edit entire series (date/time-of-day not changed for past events)
                </label>
              </div>
            </div>
          )}
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
              <Select value={draft.day} onValueChange={(v) => {
                const target = DAYS.indexOf(v); // 0=Mon..6=Sun
                const targetJs = (target + 1) % 7; // JS getDay: 0=Sun..6=Sat
                const [y, m, d] = (draft.date || "").split("-").map(Number);
                if (y && m && d) {
                  const cur = new Date(y, m - 1, d);
                  const diff = targetJs - cur.getDay();
                  cur.setDate(cur.getDate() + diff);
                  const iso = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}-${String(cur.getDate()).padStart(2,"0")}`;
                  setDraft({ ...draft, day: v, date: iso } as never);
                } else {
                  update("day", v as never);
                }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date">
              <Input type="date" value={draft.date} onChange={(e) => {
                const iso = e.target.value;
                const [y, m, d] = iso.split("-").map(Number);
                if (y && m && d) {
                  const js = new Date(y, m - 1, d).getDay();
                  const dayLabel = DAYS[(js + 6) % 7];
                  setDraft({ ...draft, date: iso, day: dayLabel } as never);
                } else {
                  update("date", iso as never);
                }
              }} />
            </Field>
            <Field label="Start">
              <Input type="time" value={draft.start_time} onChange={(e) => update("start_time", e.target.value as never)} />
            </Field>
            <Field label="End">
              <Input type="time" value={draft.end_time} onChange={(e) => update("end_time", e.target.value as never)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <Field label="Second time slot (optional)">
              {draft.start_time_2 || draft.end_time_2 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline self-start"
                  onClick={() => {
                    update("start_time_2", null as never);
                    update("end_time_2", null as never);
                  }}
                >
                  Remove second time
                </button>
              ) : (
                <button
                  type="button"
                  className="text-xs text-primary underline self-start"
                  onClick={() => {
                    update("start_time_2", "14:00" as never);
                    update("end_time_2", "16:00" as never);
                  }}
                >
                  + Add second time
                </button>
              )}
            </Field>
            <Field label="Start 2">
              <Input
                type="time"
                disabled={!draft.start_time_2 && !draft.end_time_2}
                value={draft.start_time_2 ?? ""}
                onChange={(e) => update("start_time_2", (e.target.value || null) as never)}
              />
            </Field>
            <Field label="End 2">
              <Input
                type="time"
                disabled={!draft.start_time_2 && !draft.end_time_2}
                value={draft.end_time_2 ?? ""}
                onChange={(e) => update("end_time_2", (e.target.value || null) as never)}
              />
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
            <RichDescriptionEditor
              value={draft.description}
              onChange={(v) => update("description", v as never)}
            />
          </Field>
          {isNew && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Repeats">
                <Select value={draft.recurrence} onValueChange={(v) => update("recurrence", v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {draft.recurrence !== "none" && (
                <Field label="Repeat until">
                  <Input
                    type="date"
                    value={draft.recurrence_end_date ?? ""}
                    min={draft.date}
                    onChange={(e) => update("recurrence_end_date", (e.target.value || null) as never)}
                  />
                </Field>
              )}
            </div>
          )}
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
          <Button
            onClick={() => onSave(draft, scope)}
            disabled={
              saving ||
              !draft.title ||
              (isNew && draft.recurrence !== "none" && !draft.recurrence_end_date)
            }
          >
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

function RichDescriptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function wrap(before: string, after: string = before, placeholder = "text") {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length;
      ta.setSelectionRange(pos, pos + selected.length);
    });
  }

  function prefixLines(prefix: string | ((i: number) => string)) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = end + (value.slice(end).indexOf("\n") === -1 ? value.length - end : value.slice(end).indexOf("\n"));
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const newBlock = lines
      .map((l, i) => (typeof prefix === "string" ? prefix : prefix(i)) + l)
      .join("\n");
    const next = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
    onChange(next);
    requestAnimationFrame(() => ta.focus());
  }

  function insertLink() {
    const url = window.prompt("Link URL");
    if (!url) return;
    wrap("[", `](${url})`, "link text");
  }

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition";

  return (
    <div className="rounded-md border border-input bg-transparent">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
        <button type="button" className={btn} title="Bold" onClick={() => wrap("**")}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Italic" onClick={() => wrap("*")}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Bulleted list" onClick={() => prefixLines("- ")}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Numbered list" onClick={() => prefixLines((i) => `${i + 1}. `)}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Insert link" onClick={insertLink}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <span className="ml-2 text-[11px] text-muted-foreground">Markdown supported</span>
      </div>
      <Textarea
        ref={ref}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 focus-visible:ring-0 rounded-t-none"
      />
    </div>
  );
}
