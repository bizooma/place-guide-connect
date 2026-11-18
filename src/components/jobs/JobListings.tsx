import { ExternalLink, MapPin, Briefcase, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobCard } from "@/lib/jobs/jobs.functions";

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

export function JobListings({ jobs }: { jobs: JobCard[] }) {
  return (
    <section className="mb-8" aria-labelledby="jobs-heading">
      <h2 id="jobs-heading" className="font-display text-2xl font-semibold text-primary-deep">Jobs open now in Amarillo</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        These listings come from the employers' own career sites. Jobs can fill before they are removed — always check with the employer.
      </p>
      {jobs.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-warm/50 p-4 text-sm text-muted-foreground">
          No listings right now. Please check back soon.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {jobs.map((j) => {
            const ago = postedAgo(j.posted_at);
            return (
              <li key={j.id} className="surface-card border-border/60 p-5">
                <h3 className="font-display text-lg font-semibold text-primary-deep">{j.title}</h3>
                <p className="text-sm font-medium text-foreground">{j.employer}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {j.location_text && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location_text}</span>}
                  {j.job_type && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{j.job_type}</span>}
                  {ago && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{ago}</span>}
                </div>
                {j.description && <p className="mt-3 text-sm text-muted-foreground">{oneLine(j.description)}</p>}
                <div className="mt-3 flex gap-2 rounded-xl border border-primary/30 bg-secondary p-3 text-sm font-medium text-primary-deep">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span><span className="font-semibold">What you need: </span>{j.eligibility || "Requirements not stated in the posting — ask the employer."}</span>
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
