import { createHash } from "node:crypto";

/**
 * Per-IP rate limiting for unauthenticated AI endpoints.
 * Uses the service-role client so the counter table is not client-writable.
 */
export function hashIp(forwardedFor: string | null | undefined): string {
  const ip = (forwardedFor ?? "").split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export async function checkRateLimit(
  endpoint: string,
  ipHash: string,
  limitPerHour: number,
): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.DOCUMENT_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return true; // fail open if not configured

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, serviceKey, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: rows } = await admin
    .from("ai_rate_limit")
    .select("count")
    .eq("ip_hash", ipHash)
    .eq("endpoint", endpoint)
    .gte("window_start", hourAgo);

  const total = (rows ?? []).reduce(
    (sum: number, r: { count: number | null }) => sum + (r.count ?? 0),
    0,
  );
  if (total >= limitPerHour) return false;

  await admin.from("ai_rate_limit").insert({ ip_hash: ipHash, endpoint, count: 1 });
  return true;
}
