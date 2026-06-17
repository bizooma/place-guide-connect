import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, Languages as LanguagesIcon, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { useI18n } from "@/lib/i18n";
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

function SchedulePage() {
  const { t } = useI18n();
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"today" | "week" | "all">("week");

  const { data: scheduleItems = [], isLoading } = useQuery({
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

  const items = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);
    return scheduleItems.filter((s) => {
      if (category !== "All" && s.category !== category) return false;
      if (view === "today" && s.date !== today) return false;
      if (view === "week" && (s.date < today || s.date > weekEnd)) return false;
      return true;
    });
  }, [category, view, scheduleItems]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">{t("schedule.title")}</h1>
          <p className="mt-2 text-muted-foreground">Walk-in welcome unless noted. Times may change.</p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-warm p-1">
          {[
            { id: "today", label: t("schedule.today") },
            { id: "week", label: t("schedule.week") },
            { id: "all", label: t("schedule.all") },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id as any)}
              className={"rounded-full px-4 py-2 text-sm font-medium transition " + (view === v.id ? "bg-primary text-primary-foreground" : "text-primary-deep/80 hover:bg-secondary")}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {scheduleCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={"rounded-full border px-3.5 py-1.5 text-sm transition " + (category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-warm hover:border-primary/40")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <p className="col-span-full text-muted-foreground">Nothing scheduled here yet. Try a different view or category.</p>
        )}
        {items.map((s) => (
          <article key={s.id} className="surface-card flex flex-col p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">{s.category}</span>
            <h3 className="mt-1 font-display text-xl font-semibold text-primary-deep">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><span>{s.day} · {s.date}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>{s.startTime} – {s.endTime}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>{s.location}</span></div>
              <div className="flex items-center gap-2"><LanguagesIcon className="h-4 w-4 text-primary" /><span>{s.language}</span></div>
            </dl>
            <div className="mt-auto pt-4">
              {s.registrationRequired && <p className="mb-2 text-xs font-medium text-accent">Registration required</p>}
              <Button className="w-full rounded-full bg-primary hover:bg-primary-deep" onClick={() => toast.success("We'll save your interest — a staff member will follow up.")}>
                {t("schedule.interested")}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Disclaimer className="mt-10">Schedule changes happen. If something is important to you, call The PLACE to confirm.</Disclaimer>
    </div>
  );
}
