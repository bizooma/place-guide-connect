// Server-only: syncs Amarillo job postings from employers' Workday career sites
// into public.job_postings using the service-role key. Never import from client code.
import { createClient } from "@supabase/supabase-js";

type Source = {
  tenant: string;
  employer: string;
  cxs: string;
  site: string;
  facets: Record<string, string[]>;
  tags: string[];
};

const SOURCES: Source[] = [
  {
    tenant: "tysonfoods",
    employer: "Tyson Foods — Amarillo Plant",
    cxs: "https://tysonfoods.wd5.myworkdayjobs.com/wday/cxs/tysonfoods/TSN",
    site: "https://tysonfoods.wd5.myworkdayjobs.com/TSN",
    facets: { locationHierarchy1: ["e546118310fc01af4b68755a01304618"] },
    tags: ["food-processing"],
  },
  {
    tenant: "marmon",
    employer: "Amarillo Gear Company",
    cxs: "https://marmon.wd501.myworkdayjobs.com/wday/cxs/marmon/Marmon_Careers",
    site: "https://marmon.wd501.myworkdayjobs.com/Marmon_Careers",
    facets: { locations: ["a61e4eb202291001eeb5d0a8b2230000"] },
    tags: ["manufacturing"],
  },
];

const PAGE = 20; // Workday rejects limit > 20 with HTTP 400

type ListItem = { title?: string; externalPath?: string; locationsText?: string; postedOn?: string; bulletFields?: string[] };
type Detail = { jobPostingInfo?: { title?: string; jobDescription?: string; startDate?: string; timeType?: string; externalUrl?: string; jobReqId?: string } };

function adminClient() {
  // The SUPABASE_ prefix is reserved by the platform, so the service-role key is
  // also accepted under PLACE_SERVICE_ROLE_KEY. Server-only: never sent to the browser.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.PLACE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL;
  if (!key) throw new Error("Job sync not configured: SUPABASE_SERVICE_ROLE_KEY (or PLACE_SERVICE_ROLE_KEY) is missing.");
  if (!url) throw new Error("Job sync not configured: SUPABASE_URL is missing.");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", bull: "•", hellip: "…" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export function stripHtml(html: string): string {
  let s = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = decodeEntities(s).replace(/\u00a0/g, " ");
  s = s.split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

export function stripBoilerplate(text: string): string {
  let s = text.replace(/As a part of the global industrial organization Marmon Holdings[\s\S]*?be their best\.?/gi, "");
  s = s.trim();
  // Leading labels, possibly repeated in sequence
  for (let i = 0; i < 4; i++) {
    const before = s;
    s = s.replace(/^Amarillo Gear Company LLC[^\n]*\n?/i, "").trim();
    s = s.replace(/^Job Details:\s*/i, "").trim();
    s = s.replace(/^(SCOPE|ISCOPE|Position Summary):\s*/i, "").trim();
    if (s === before) break;
  }
  s = s.replace(/SECIAL SKILLS/g, "SPECIAL SKILLS");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

const DIPLOMA_RE = /high school|diploma|\bGED\b|bachelor|associate'?s degree|degree|\bCPA\b|\bMBA\b/i;
const EXPERIENCE_RE = /\d+\+?\s*(?:-\s*\d+\s*)?years?|years of experience|trade school|machining certificate|demonstrated experience|certificate from/i;
const ENGLISH_RE = /read|written|writing|blueprint|checklist|documentation|gauges|micrometer|communicat|verbal/i;
const COLLEGE_RE = /bachelor|associate'?s degree|\bCPA\b|\bMBA\b|college degree/i;

export function deriveEligibility(desc: string) {
  const requires_diploma = DIPLOMA_RE.test(desc);
  const requires_experience = EXPERIENCE_RE.test(desc);
  const requires_english = ENGLISH_RE.test(desc) || requires_diploma || requires_experience;
  const parts: string[] = [];
  if (requires_diploma) parts.push(COLLEGE_RE.test(desc) ? "College degree or professional certification." : "High school diploma or GED.");
  if (requires_experience) parts.push("Prior experience or trade training expected.");
  if (requires_english) parts.push("Must be able to read and communicate in English on the job.");
  const eligibility = parts.length ? parts.join(" ") : "Requirements not stated in the posting — ask the employer.";
  return { requires_diploma, requires_experience, requires_english, eligibility };
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function listAll(src: Source): Promise<ListItem[]> {
  const out: ListItem[] = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const res = await fetch(`${src.cxs}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ appliedFacets: src.facets, limit: PAGE, offset, searchText: "" }),
    });
    if (!res.ok) throw new Error(`${src.tenant} list HTTP ${res.status}`);
    const json = (await res.json()) as { total?: number; jobPostings?: ListItem[] };
    if (offset === 0) total = json.total ?? 0;
    const page = json.jobPostings ?? [];
    out.push(...page);
    if (page.length === 0) break;
    offset += PAGE;
  }
  return out;
}

async function syncSource(src: Source, runStart: string) {
  const admin = adminClient();
  const items = (await listAll(src)).filter((j) => (j.locationsText ?? "").includes("Amarillo") && j.externalPath);
  const rows = [];
  for (const item of items) {
    const res = await fetch(`${src.cxs}${item.externalPath}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${src.tenant} detail HTTP ${res.status}`);
    const info = ((await res.json()) as Detail).jobPostingInfo ?? {};
    const title = (info.title ?? item.title ?? "").trim();
    const description = stripBoilerplate(stripHtml(info.jobDescription ?? ""));
    const externalId = item.bulletFields?.[0] ?? info.jobReqId;
    if (!externalId || !title) continue;
    rows.push({
      source: "workday",
      source_tenant: src.tenant,
      external_id: externalId,
      employer: src.employer,
      title,
      description,
      location_text: item.locationsText ?? null,
      apply_url: info.externalUrl || `${src.site}${item.externalPath}`,
      job_type: info.timeType ?? null,
      posted_at: info.startDate ? info.startDate.slice(0, 10) : null,
      tags: src.tags,
      content_hash: await sha256(`${title}\n${description}`),
      active: true,
      last_seen_at: new Date().toISOString(),
      ...deriveEligibility(description),
    });
  }
  if (rows.length) {
    // Separate read of stored hashes (never chained onto the upsert).
    const { data: existing, error: exErr } = await admin
      .from("job_postings")
      .select("external_id, content_hash")
      .eq("source_tenant", src.tenant);
    if (exErr) throw new Error(`${src.tenant} read hashes: ${exErr.message}`);
    const stored = new Map((existing ?? []).map((r) => [r.external_id as string, r.content_hash as string | null]));
    for (const r of rows as Array<Record<string, unknown>>) {
      // New posting or changed text: drop any translation of the old text.
      if (stored.get(r.external_id as string) !== r.content_hash) r.translations = {};
    }
    // No .select(): write without reading rows back under RLS.
    const { error } = await admin.from("job_postings").upsert(rows, { onConflict: "source_tenant,external_id" });
    if (error) throw new Error(`${src.tenant} upsert: ${error.message}`);
  }
  // Only reached when this source's fetch + write succeeded.
  const { error: deErr } = await admin
    .from("job_postings")
    .update({ active: false })
    .eq("source_tenant", src.tenant)
    .lt("last_seen_at", runStart);
  if (deErr) throw new Error(`${src.tenant} deactivate: ${deErr.message}`);
  return rows.length;
}

export type SyncResult = Record<string, { ok: boolean; count?: number; error?: string }>;

// In-process guard: concurrent callers share the in-flight run.
let inFlight: Promise<SyncResult> | null = null;

export function syncWorkdayJobs(): Promise<SyncResult> {
  if (!inFlight) {
    inFlight = runSync().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runSync(): Promise<SyncResult> {
  const runStart = new Date().toISOString();
  const results: SyncResult = {};
  for (const src of SOURCES) {
    try {
      results[src.tenant] = { ok: true, count: await syncSource(src, runStart) };
    } catch (e) {
      console.error(`[jobs] sync failed for ${src.tenant}:`, e);
      results[src.tenant] = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return results;
}
