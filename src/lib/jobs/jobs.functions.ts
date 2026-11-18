import { createServerFn } from "@tanstack/react-start";

export type JobTranslations = Record<string, Partial<Record<"title" | "description" | "eligibility", string>>>;

export type JobCard = {
  id: string;
  title: string;
  employer: string;
  location_text: string | null;
  job_type: string | null;
  posted_at: string | null;
  description: string | null;
  eligibility: string | null;
  apply_url: string;
  translations: JobTranslations;
};

export type JobsResult =
  | { status: "ok"; jobs: JobCard[]; newestSeenAt: string | null }
  | { status: "error" };

/** Reads active job postings. Syncing is handled by POST /api/jobs/sync. */
export const getAmarilloJobs = createServerFn({ method: "GET" }).handler(async (): Promise<JobsResult> => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const db = createClient(process.env.SUPABASE_URL!, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data, error } = await db
      .from("job_postings")
      .select("id,title,employer,location_text,job_type,posted_at,description,eligibility,apply_url,translations,last_seen_at")
      .eq("active", true)
      .order("posted_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    const rows = data ?? [];
    let newest: string | null = null;
    for (const r of rows) if (!newest || r.last_seen_at > newest) newest = r.last_seen_at;
    const jobs: JobCard[] = rows.map(({ last_seen_at: _l, translations, ...r }) => ({
      ...r,
      translations: (translations ?? {}) as JobTranslations,
    }));
    return { status: "ok", jobs, newestSeenAt: newest };
  } catch (e) {
    console.error("[jobs] read failed:", e);
    return { status: "error" };
  }
});
