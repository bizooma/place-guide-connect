import { createFileRoute } from "@tanstack/react-router";

async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  // Hash both so lengths match, then compare every byte.
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = a.length ^ b.length;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const notAllowed = () => new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });

export const Route = createFileRoute("/api/jobs/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.JOBS_SYNC_SECRET;
        if (!secret) {
          console.error("[jobs-sync] JOBS_SYNC_SECRET is not configured; refusing to run.");
          return new Response("Service Unavailable", { status: 503 });
        }
        const provided = request.headers.get("x-jobs-sync-secret") ?? "";
        if (!(await constantTimeEqual(provided, secret))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { syncWorkdayJobs } = await import("@/lib/jobs/workday.server");
        const result = await syncWorkdayJobs();
        if (Object.values(result).every((r) => !r.ok)) {
          console.error("[jobs-sync] ALL SOURCES FAILED:", JSON.stringify(result));
        }
        return Response.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
      },
      GET: notAllowed,
      PUT: notAllowed,
      PATCH: notAllowed,
      DELETE: notAllowed,
      HEAD: notAllowed,
      OPTIONS: notAllowed,
    },
  },
});
