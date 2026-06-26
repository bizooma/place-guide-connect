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
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const body = {
    model: "google/gemini-2.5-flash-lite",
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate each input string into ${target}. Preserve proper nouns (organization names, place names, people's names) in their original form. Keep tone warm, simple, and natural. Return ONLY a JSON object {"translations": string[]} with the SAME length and order as the input.`,
      },
      {
        role: "user",
        content: JSON.stringify({ target, texts }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  };

  const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
  let res: Response | null = null;
  let errText = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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
    if (res?.status === 429) {
      throw new Error("Translation is busy right now. Please try again in a moment.");
    }
    if (res?.status === 402) {
      throw new Error("Translation credits exhausted. Please add credits in workspace settings.");
    }
    throw new Error(`Translation failed: ${res?.status ?? "network"} ${errText.slice(0, 200)}`);
  }

  const json: any = await res.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: readErr } = await supabaseAdmin
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

    const { error: updErr } = await supabaseAdmin
      .from(data.table)
      .update({ translations })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, languages: Object.keys(TARGET_LANGS) };
  });
