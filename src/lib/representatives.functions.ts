import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { createHash } from "node:crypto";

// State codes whose sole House district is at-large.
const AT_LARGE_STATES = new Set(["AK", "DE", "ND", "SD", "VT", "WY"]);

type NormalizedPerson = {
  name: string;
  party: string | null;
  photoUrl: string | null;
  photoAttribution: string | null;
  websiteUrl: string | null;
  contactFormUrl: string | null;
  phone: string | null;
  officeAddress: string | null;
  bioguideId: string | null;
  twitter: string | null;
};

type NormalizedDistrict = {
  state: string;
  districtNumber: number;
  districtLabel: string;
  congress: string;
  proportion: number;
  representative: NormalizedPerson | null;
  senators: NormalizedPerson[];
};

export type LookupResponse = {
  matchedAddress: string | null;
  approximate: boolean;
  districts: NormalizedDistrict[];
};

function buildCacheKey(address: string) {
  return address
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function districtLabel(state: string, districtNumber: number) {
  if (!districtNumber || districtNumber === 0 || AT_LARGE_STATES.has(state)) {
    return `${state}-AL`;
  }
  return `${state}-${String(districtNumber).padStart(2, "0")}`;
}

function normalizePerson(l: any): NormalizedPerson {
  const first = l?.bio?.first_name ?? "";
  const last = l?.bio?.last_name ?? "";
  const name = `${first} ${last}`.trim();
  return {
    name: name || "Unknown",
    party: l?.bio?.party ?? null,
    photoUrl: l?.bio?.photo_url ?? null,
    photoAttribution: l?.bio?.photo_attribution ?? null,
    websiteUrl: l?.contact?.url ?? null,
    contactFormUrl: l?.contact?.contact_form ?? null,
    phone: l?.contact?.phone ?? null,
    officeAddress: l?.contact?.address ?? null,
    bioguideId: l?.references?.bioguide_id ?? null,
    twitter: l?.social?.twitter ?? null,
  };
}

export const lookupRepresentatives = createServerFn({ method: "POST" })
  .inputValidator(z.object({ address: z.string() }))
  .handler(async ({ data }): Promise<LookupResponse> => {
    const address = data.address.trim();
    if (address.length < 5 || address.length > 200) {
      throw new Response(JSON.stringify({ error: "invalid_address" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const apiKey = process.env.GEOCODIO_API_KEY;
    if (!apiKey) {
      throw new Response(JSON.stringify({ error: "not_configured" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // IP-hash rate limit
    const fwd = getRequestHeader("x-forwarded-for") ?? "";
    const ip = fwd.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");

    const { createClient } = await import("@supabase/supabase-js");
    const pubKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabaseAdmin = createClient(process.env.SUPABASE_URL!, pubKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (pubKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${pubKey}`) h.delete("Authorization");
          h.set("apikey", pubKey);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    // Rolling 1-hour window
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: rlRows } = await supabaseAdmin
      .from("rep_lookup_rate_limit")
      .select("count")
      .eq("ip_hash", ipHash)
      .gte("window_start", hourAgo);
    const total = (rlRows ?? []).reduce((s, r: any) => s + (r.count ?? 0), 0);
    if (total >= 30) {
      throw new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "content-type": "application/json" },
      });
    }
    await supabaseAdmin
      .from("rep_lookup_rate_limit")
      .insert({ ip_hash: ipHash, count: 1 });

    // Cache lookup
    const cacheKey = buildCacheKey(address);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabaseAdmin
      .from("rep_lookup_cache")
      .select("payload,created_at")
      .eq("cache_key", cacheKey)
      .gte("created_at", thirtyDaysAgo)
      .maybeSingle();
    if (cached?.payload) return cached.payload as LookupResponse;

    // External call
    const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(
      address,
    )}&fields=cd&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[Geocodio] non-200", res.status, body.slice(0, 500));
      throw new Response(JSON.stringify({ error: "lookup_failed" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    const gc = (await res.json()) as any;
    const results: any[] = gc?.results ?? [];
    if (results.length === 0) {
      return { matchedAddress: null, approximate: false, districts: [] };
    }

    const top = results[0];
    const accuracy = typeof top.accuracy === "number" ? top.accuracy : 1;
    const accuracyType = top.accuracy_type ?? "";
    const approximate =
      accuracy < 0.8 || ["place", "state", "nearest_place"].includes(accuracyType);

    const cds: any[] = top?.fields?.congressional_districts ?? [];
    const districts: NormalizedDistrict[] = cds.map((d) => {
      const legs: any[] = d?.current_legislators ?? [];
      const rep = legs.find((l) => l.type === "representative");
      const sens = legs.filter((l) => l.type === "senator");
      const state: string =
        rep?.bio?.address_state ??
        d?.ocd_id?.match(/state:([a-z]{2})/i)?.[1]?.toUpperCase() ??
        "";
      const num = Number(d?.district_number ?? 0);
      const congressNum = Number(d?.congress_number ?? 0);
      return {
        state,
        districtNumber: num,
        districtLabel: districtLabel(state, num),
        congress: congressNum ? `${ordinal(congressNum)}` : "",
        proportion: typeof d?.proportion === "number" ? d.proportion : 1,
        representative: rep ? normalizePerson(rep) : null,
        senators: sens.map(normalizePerson),
      };
    });

    districts.sort((a, b) => b.proportion - a.proportion);

    const payload: LookupResponse = {
      matchedAddress: top.formatted_address ?? null,
      approximate,
      districts,
    };

    if (districts.length > 0) {
      await supabaseAdmin
        .from("rep_lookup_cache")
        .upsert({ cache_key: cacheKey, payload }, { onConflict: "cache_key" });
    }

    return payload;
  });
