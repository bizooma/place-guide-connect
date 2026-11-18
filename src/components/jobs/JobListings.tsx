import { ExternalLink, MapPin, Briefcase, Clock, ShieldCheck, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { JobCard, JobsResult } from "@/lib/jobs/jobs.functions";

const PHONE_DISPLAY = "(806) 553-5155";
const PHONE_TEL = "+18065535155";
const STALE_NOTE_MS = 48 * 60 * 60 * 1000;

function postedAgo(date: string | null): string | null {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date + "T12:00:00Z").getTime()) / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Posted ${months} month${months === 1 ? "" : "s"} ago`;
}

function oneLine(desc: string | null): string {
  if (!desc) return "";
  const first = desc.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return first.length > 220 ? first.slice(0, 217).trimEnd() + "…" : first;
}

function pick(j: JobCard, lang: string, field: "title" | "description" | "eligibility"): string | null {
  const base = j[field];
  if (lang === "en") return base;
  const tr = j.translations?.[lang]?.[field];
  return tr && tr.trim() ? tr : base;
}

function CallUs({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 rounded-xl border border-border bg-warm/50 p-4 text-sm">
      <p className="text-foreground">{message}</p>
      <a href={`tel:${PHONE_TEL}`} className="mt-2 inline-flex items-center gap-1.5 font-medium text-accent">
        <Phone className="h-4 w-4" />{PHONE_DISPLAY}
      </a>
      <p className="mt-2 whitespace-pre-line text-muted-foreground">
        {t("app.hours", "Hours: Monday–Thursday 9am–5pm,\nFriday 9am–1pm.\nClosed Saturday and Sunday.")}
      </p>
    </div>
  );
}

export function JobListings({ result }: { result: JobsResult }) {
  const { language } = useI18n();
  const stale =
    result.status === "ok" && result.newestSeenAt && Date.now() - new Date(result.newestSeenAt).getTime() > STALE_NOTE_MS
      ? new Date(result.newestSeenAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;
  return (
    <section className="mb-8" aria-labelledby="jobs-heading">
      <h2 id="jobs-heading" className="font-display text-2xl font-semibold text-primary-deep">Jobs open now in Amarillo</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        These listings come from the employers' own career sites. Jobs can fill before they are removed — always check with the employer.
      </p>
      {stale && <p className="mt-1 text-xs text-muted-foreground">This list was last checked {stale}.</p>}
      {result.status === "error" ? (
        <CallUs message="We can't load the job listings right now. Please call us and we'll help you look." />
      ) : result.jobs.length === 0 ? (
        <CallUs message="There are no openings posted right now. Check back soon, or call us — we may know about jobs that aren't listed here." />
      ) : (
        <ul className="mt-4 grid gap-3">
          {result.jobs.map((j) => {
            const ago = postedAgo(j.posted_at);
            const title = pick(j, language, "title");
            const desc = pick(j, language, "description");
            const elig = pick(j, language, "eligibility");
            return (
              <li key={j.id} className="surface-card border-border/60 p-5">
                <h3 className="font-display text-lg font-semibold text-primary-deep">{title}</h3>
                <p className="text-sm font-medium text-foreground">{j.employer}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {j.location_text && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location_text}</span>}
                  {j.job_type && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{j.job_type}</span>}
                  {ago && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{ago}</span>}
                </div>
                {desc && <p className="mt-3 text-sm text-muted-foreground">{oneLine(desc)}</p>}
                <div className="mt-3 flex gap-2 rounded-xl border border-primary/30 bg-secondary p-3 text-sm font-medium text-primary-deep">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span><span className="font-semibold">What you need: </span>{elig || "Requirements not stated in the posting — ask the employer."}</span>
                </div>
                <Button asChild size="sm" className="mt-4 rounded-full bg-primary hover:bg-primary-deep gap-1.5">
                  <a href={j.apply_url} target="_blank" rel="noopener noreferrer">
                    Apply on the employer's site <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
