import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  texts: z.array(z.string()).max(200),
  target: z.string().min(2).max(50),
});

async function callGemini(target: string, texts: string[]): Promise<string[]> {
  if (!target || /^en(glish)?$/i.test(target)) return texts;
  if (texts.length === 0) return [];
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const body = {
    system_instruction: {
      parts: [
        {
          text: `You are a professional translator. Translate each input string into ${target}. Preserve proper nouns (organization names, place names, people's names) in their original form. Keep tone warm, simple, and natural. Return ONLY a JSON object matching the schema, where "translations" is an array with the SAME length and order as the input.`,
        },
      ],
    },
    contents: [
      { role: "user", parts: [{ text: JSON.stringify({ target, texts }) }] },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: {
        type: "object",
        properties: { translations: { type: "array", items: { type: "string" } } },
        required: ["translations"],
      },
      temperature: 0.2,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  let res: Response | null = null;
  let errText = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) break;
    errText = await res.text();
    if (res.status === 503 || res.status === 429 || res.status >= 500) {
      const delay = 500 * Math.pow(2, attempt) + Math.random() * 250;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    break;
  }
  if (!res || !res.ok) {
    if (res?.status === 503) {
      throw new Error("Translation is temporarily unavailable due to high demand. Please try again in a moment.");
    }
    throw new Error(`Translation failed: ${res?.status ?? "network"} ${errText.slice(0, 200)}`);
  }

  const json: any = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const parsed = JSON.parse(text) as { translations: string[] };
    if (Array.isArray(parsed.translations) && parsed.translations.length === texts.length) {
      return parsed.translations;
    }
  } catch {
    // fall through
  }
  return texts;
}

/**
 * Batch-translate short UI strings (client-side cached) into the target language.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<string[]> => {
    return callGemini(data.target.trim(), data.texts);
  });

// ---- Admin: pre-translate a DB row into all supported languages ----

const TARGET_LANGS: Record<string, string> = {
  es: "Spanish",
  fa: "Dari (Farsi)",
  ps: "Pashto",
  so: "Somali",
  ar: "Arabic",
};

const RESOURCE_FIELDS = ["name", "category", "description", "hours", "eligibility"] as const;
const SCHEDULE_FIELDS = ["title", "category", "description", "location", "language"] as const;

const RowInput = z.object({
  table: z.enum(["resources", "schedule_items"]),
  id: z.string().uuid(),
});

export const translateRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RowInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify admin
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const fields = data.table === "resources" ? RESOURCE_FIELDS : SCHEDULE_FIELDS;

    const { data: row, error: readErr } = await supabase
      .from(data.table)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Row not found");

    // Build ordered text list of non-empty fields
    const keys: string[] = [];
    const texts: string[] = [];
    for (const f of fields) {
      const v = (row as any)[f];
      if (typeof v === "string" && v.trim()) {
        keys.push(f);
        texts.push(v);
      }
    }

    const translations: Record<string, Record<string, string>> = {};
    for (const [code, name] of Object.entries(TARGET_LANGS)) {
      const out = await callGemini(name, texts);
      const map: Record<string, string> = {};
      keys.forEach((k, i) => { map[k] = out[i] ?? texts[i]; });
      translations[code] = map;
    }

    const { error: updErr } = await supabase
      .from(data.table)
      .update({ translations })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, languages: Object.keys(TARGET_LANGS) };
  });

// Bulk translate all schedule_items missing translations, deduped by content.
export const translateScheduleAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { data: rows, error: readErr } = await supabase
      .from("schedule_items")
      .select("id, title, category, description, location, language, translations");
    if (readErr) throw new Error(readErr.message);

    const langCodes = Object.keys(TARGET_LANGS);
    const needs = (rows ?? []).filter((r: any) => {
      const tr = r.translations ?? {};
      return langCodes.some((c) => !tr[c] || Object.keys(tr[c]).length === 0);
    });

    const groups = new Map<string, { keys: string[]; texts: string[]; ids: string[] }>();
    for (const r of needs as any[]) {
      const keys: string[] = [];
      const texts: string[] = [];
      for (const f of SCHEDULE_FIELDS) {
        const v = r[f];
        if (typeof v === "string" && v.trim()) {
          keys.push(f);
          texts.push(v);
        }
      }
      const sig = JSON.stringify([keys, texts]);
      const g = groups.get(sig);
      if (g) g.ids.push(r.id);
      else groups.set(sig, { keys, texts, ids: [r.id] });
    }

    let translatedGroups = 0;
    let failedGroups = 0;
    let updatedRows = 0;

    for (const group of groups.values()) {
      try {
        const translations: Record<string, Record<string, string>> = {};
        for (const [code, name] of Object.entries(TARGET_LANGS)) {
          const out = await callGemini(name, group.texts);
          const map: Record<string, string> = {};
          group.keys.forEach((k, i) => { map[k] = out[i] ?? group.texts[i]; });
          translations[code] = map;
        }
        for (const id of group.ids) {
          const { error: updErr } = await supabaseAdmin
            .from("schedule_items")
            .update({ translations })
            .eq("id", id);
          if (!updErr) updatedRows++;
        }
        translatedGroups++;
      } catch {
        failedGroups++;
      }
    }

    return {
      ok: true,
      uniqueGroups: groups.size,
      translatedGroups,
      failedGroups,
      updatedRows,
      totalNeeded: needs.length,
    };
  });
