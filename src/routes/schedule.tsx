import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, Languages as LanguagesIcon, CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, CalendarRange } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { scheduleCategories } from "@/data/mock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — The PLACE Online" },
      { name: "description", content: "Classes, drop-in help, and community events at The PLACE." },
      { property: "og:title", content: "Schedule — The PLACE Online" },
      { property: "og:description", content: "See what's happening this week." },
    ],
  }),
  component: SchedulePage,
});

interface ScheduleRow {
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
}

type Mode = "calendar" | "cards";
type CardsView = "today" | "week" | "all";

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SchedulePage() {
  const { t } = useI18n();
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState<Mode>("calendar");
  const [cardsView, setCardsView] = useState<CardsView>("week");

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["schedule_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("active", true)
        .order("date");
      if (error) throw error;
      return (data ?? []) as ScheduleRow[];
    },
  });

  const filteredItems = useMemo(
    () => scheduleItems.filter((s) => category === "All" || s.category === category),
    [scheduleItems, category],
  );

  const allTexts = useMemo(() => {
    const out: string[] = [];
    for (const s of scheduleItems) {
      if (s.title) out.push(s.title);
      if (s.category) out.push(s.category);
      if (s.description) out.push(s.description);
      if (s.location) out.push(s.location);
      if (s.language) out.push(s.language);
    }
    for (const c of scheduleCategories) out.push(c);
    return out;
  }, [scheduleItems]);
  const tx = useTranslatedTexts(allTexts);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">{t("schedule.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("schedule.subtitle")}</p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-warm p-1">
          {[
            { id: "calendar" as const, label: t("schedule.calendar"), icon: CalendarRange },
            { id: "cards" as const, label: t("schedule.cards"), icon: LayoutGrid },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setMode(v.id)}
                className={"inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition " + (mode === v.id ? "bg-primary text-primary-foreground" : "text-primary-deep/80 hover:bg-secondary")}
              >
                <Icon className="h-4 w-4" />
                {v.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {scheduleCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={"rounded-full border px-3.5 py-1.5 text-sm transition " + (category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-warm hover:border-primary/40")}
          >
            {c === "All" ? t("schedule.all") : tx(c)}
          </button>
        ))}
      </div>

      {mode === "calendar" ? (
        <CalendarView items={filteredItems} t={t} tx={tx} />
      ) : (
        <CardsView items={filteredItems} view={cardsView} setView={setCardsView} t={t} tx={tx} />
      )}

      <Disclaimer className="mt-10">{t("schedule.disclaimer")}</Disclaimer>
    </div>
  );
}

const CATEGORY_DOT: Record<string, string> = {
  "English Language Classes": "bg-primary",
  "Life Skills Classes": "bg-accent",
  "Community Events": "bg-primary-deep",
  "Document Help": "bg-secondary-foreground",
  "Job Help": "bg-muted-foreground",
};

function CalendarView({ items, t }: { items: ScheduleRow[]; t: (k: string, fallback?: string) => string }) {
  const initial = useMemo(() => {
    const now = new Date();
    if (items.some((i) => {
      const d = parseLocalDate(i.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })) return new Date(now.getFullYear(), now.getMonth(), 1);
    const future = items.map((i) => parseLocalDate(i.date)).filter((d) => d >= new Date(now.getFullYear(), now.getMonth(), 1)).sort((a, b) => a.getTime() - b.getTime())[0];
    const target = future ?? (items[0] ? parseLocalDate(items[0].date) : now);
    return new Date(target.getFullYear(), target.getMonth(), 1);
  }, [items]);

  const [cursor, setCursor] = useState<Date>(initial);
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();
    for (const it of items) {
      const list = map.get(it.date) ?? [];
      list.push(it);
      map.set(it.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [items]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISO(new Date());

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedItems = selected ? byDate.get(selected) ?? [] : [];

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-primary-deep">{monthLabel}</h2>
        <div className="inline-flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            {t("schedule.todayBtn")}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-warm">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-primary-deep/70">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell) return <div key={idx} className="min-h-24 border-b border-r border-border/60 bg-background/30 md:min-h-28" />;
            const iso = toISO(cell);
            const dayItems = byDate.get(iso) ?? [];
            const isToday = iso === todayISO;
            const isSelected = iso === selected;
            return (
              <button
                key={idx}
                onClick={() => setSelected(iso)}
                className={"min-h-24 border-b border-r border-border/60 p-1.5 text-left transition md:min-h-28 " + (isSelected ? "bg-primary/10" : "hover:bg-secondary/50")}
              >
                <div className={"mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold " + (isToday ? "bg-primary text-primary-foreground" : "text-primary-deep")}>
                  {cell.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 3).map((it) => (
                    <div key={it.id} className="flex items-center gap-1 truncate text-[11px] text-primary-deep/85">
                      <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (CATEGORY_DOT[it.category] ?? "bg-primary")} />
                      <span className="truncate">{it.title}</span>
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-[10px] font-medium text-muted-foreground">+{dayItems.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-6">
          <h3 className="font-display text-xl font-semibold text-primary-deep">
            {parseLocalDate(selected).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-muted-foreground">{t("schedule.nothingDay")}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {selectedItems.map((s) => (
                <article key={s.id} className="surface-card p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-accent">{s.category}</span>
                  <h4 className="mt-1 font-display text-lg font-semibold text-primary-deep">{s.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>{s.start_time} – {s.end_time}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>{s.location}</span></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardsView({ items, view, setView, t }: { items: ScheduleRow[]; view: CardsView; setView: (v: CardsView) => void; t: (k: string) => string }) {
  const filtered = useMemo(() => {
    const today = toISO(new Date());
    const weekEnd = toISO(new Date(Date.now() + 6 * 86400000));
    return items.filter((s) => {
      if (view === "today" && s.date !== today) return false;
      if (view === "week" && (s.date < today || s.date > weekEnd)) return false;
      return true;
    });
  }, [items, view]);

  return (
    <div className="mt-6">
      <div className="inline-flex rounded-full border border-border bg-warm p-1">
        {[
          { id: "today" as const, label: t("schedule.today") },
          { id: "week" as const, label: t("schedule.week") },
          { id: "all" as const, label: t("schedule.all") },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={"rounded-full px-4 py-2 text-sm font-medium transition " + (view === v.id ? "bg-primary text-primary-foreground" : "text-primary-deep/80 hover:bg-secondary")}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <p className="col-span-full text-muted-foreground">{t("schedule.nothingHere")}</p>
        )}
        {filtered.map((s) => (
          <article key={s.id} className="surface-card flex flex-col p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">{s.category}</span>
            <h3 className="mt-1 font-display text-xl font-semibold text-primary-deep">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><span>{s.day} · {s.date}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>{s.start_time} – {s.end_time}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>{s.location}</span></div>
              <div className="flex items-center gap-2"><LanguagesIcon className="h-4 w-4 text-primary" /><span>{s.language}</span></div>
            </dl>
            <div className="mt-auto pt-4">
              {s.registration_required && <p className="mb-2 text-xs font-medium text-accent">{t("schedule.regRequired")}</p>}
              <Button className="w-full rounded-full bg-primary hover:bg-primary-deep" onClick={() => toast.success(t("schedule.interestSaved"))}>
                {t("schedule.interested")}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
