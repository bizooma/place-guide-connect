import { createServerFn } from "@tanstack/react-start";

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
};

const STALE_MS = 6 * 60 * 60 * 1000;

/** Returns active Amarillo jobs immediately; kicks off a background sync if data is >6h old. */
export const getAmarilloJobs = createServerFn({ method: "GET" }).handler(async (): Promise<JobCard[]> => {
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
      .select("id,title,employer,location_text,job_type,posted_at,description,eligibility,apply_url,last_seen_at")
      .eq("active", true)
      .order("posted_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    const rows = data ?? [];

    const newest = rows.reduce((m, r) => Math.max(m, new Date(r.last_seen_at).getTime()), 0);
    if (Date.now() - newest > STALE_MS) {
      // Fire and forget — never block the page on Workday.
      import("./workday.server")
        .then((m) => m.syncWorkdayJobs())
        .catch((e) => console.error("[jobs] background sync failed:", e));
    }
    return rows.map(({ last_seen_at: _l, ...r }) => r);
  } catch (e) {
    console.error("[jobs] read failed:", e);
    return [];
  }
});
