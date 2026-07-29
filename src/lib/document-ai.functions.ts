import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  storagePath: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  language: z.string().min(2).max(50),
});

export interface DocumentAnalysis {
  kind: string;
  summary: string;
  important: string[];
  dates: string[];
  nextSteps: string[];
  contact: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

export const analyzeDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DocumentAnalysis> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { hashIp, checkRateLimit } = await import("./rate-limit.server");
    const allowed = await checkRateLimit(
      "analyze_document",
      hashIp(getRequestHeader("x-forwarded-for")),
      10,
    );
    if (!allowed) {
      throw new Error("You've reached the limit for now. Please try again later.");
    }

    // The SUPABASE_ prefix is reserved, so the service-role key is also accepted
    // under DOCUMENT_SERVICE_ROLE_KEY. Server-only: never sent to the browser.
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.DOCUMENT_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Document reading is not configured yet (missing service key).");

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseServer = createClient(process.env.SUPABASE_URL!, serviceKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: file, error } = await supabaseServer.storage
      .from("document-uploads")
      .download(data.storagePath);
    if (error || !file) throw new Error("Could not load uploaded document.");
    if (file.size > MAX_BYTES) throw new Error("File is too large to analyze (max 10 MB).");

    const buf = new Uint8Array(await file.arrayBuffer());
    const b64 = Buffer.from(buf).toString("base64");


    const body = {
      system_instruction: {
        parts: [
          {
            text: `You help people understand official documents (bills, letters, forms, notices). Explain in plain, simple ${data.language}. Be warm and non-judgmental. Use short sentences. Avoid jargon. If a field is unclear or missing, say so honestly rather than inventing details. Return ONLY JSON matching the provided schema, with all string values written in ${data.language}.`,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: data.mimeType, data: b64 } },
            { text: `Please read this document and explain it to me in ${data.language}.` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            kind: { type: "string", description: "What kind of document this is, one short sentence." },
            summary: { type: "string", description: "A plain-language summary, 2-4 sentences." },
            important: { type: "array", items: { type: "string" }, description: "Key facts the reader should notice." },
            dates: { type: "array", items: { type: "string" }, description: "Important dates or deadlines with brief context." },
            nextSteps: { type: "array", items: { type: "string" }, description: "What the reader may want to do next." },
            contact: { type: "string", description: "Who to contact for help or questions." },
          },
          required: ["kind", "summary", "important", "dates", "nextSteps", "contact"],
        },
      },
    };

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let res: Response | null = null;
    let lastStatus = 0;
    let lastBody = "";
    outer: for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(body),
          },
        );
        if (r.ok) { res = r; break outer; }
        lastStatus = r.status;
        lastBody = await r.text().catch(() => "");
        console.error(`[analyzeDocument] ${model} attempt ${attempt + 1} -> ${r.status}`, lastBody.slice(0, 200));
        // Only retry on transient errors
        if (r.status !== 503 && r.status !== 429 && r.status !== 500) break;
        await new Promise((s) => setTimeout(s, 600 * (attempt + 1)));
      }
    }

    if (!res) {
      if (lastStatus === 503) throw new Error("AI is overloaded right now. Please try again in a minute.");
      if (lastStatus === 429) throw new Error("AI is busy right now. Please try again in a moment.");
      if (lastStatus === 403) throw new Error("AI is not authorized. Please check the API key.");
      console.error("[analyzeDocument] all attempts failed", lastStatus, lastBody);
      throw new Error("AI could not read this document. Please try a clearer photo or a different file.");
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("AI returned an empty response.");

    let parsed: DocumentAnalysis;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("AI response was not valid.");
    }
    return {
      kind: parsed.kind ?? "",
      summary: parsed.summary ?? "",
      important: Array.isArray(parsed.important) ? parsed.important : [],
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      contact: parsed.contact ?? "",
    };
  });
