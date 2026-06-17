import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  texts: z.array(z.string()).max(200),
  target: z.string().min(2).max(50),
});

/**
 * Batch-translate short UI strings (resource names, categories, schedule
 * titles, etc.) into the target language using Gemini. Returns translations
 * in the same order as the input. If target is English, returns input as-is.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<string[]> => {
    const target = data.target.trim();
    if (!target || /^en(glish)?$/i.test(target)) return data.texts;
    if (data.texts.length === 0) return [];

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
        {
          role: "user",
          parts: [{ text: JSON.stringify({ target, texts: data.texts }) }],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "object",
          properties: {
            translations: { type: "array", items: { type: "string" } },
          },
          required: ["translations"],
        },
        temperature: 0.2,
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Translation failed: ${res.status} ${errText.slice(0, 200)}`);
    }
    const json: any = await res.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    try {
      const parsed = JSON.parse(text) as { translations: string[] };
      if (Array.isArray(parsed.translations) && parsed.translations.length === data.texts.length) {
        return parsed.translations;
      }
    } catch {
      // fall through
    }
    return data.texts;
  });
