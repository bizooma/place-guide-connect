import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function createPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const EMBED_MODEL = "text-embedding-004"; // 768 dims
const CHAT_MODEL = "gemini-2.5-flash";

const MAX_BYTES = 10 * 1024 * 1024;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;
const MIN_SIMILARITY = 0.35;

// ---------- helpers ----------

function chunkText(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_SIZE, cleaned.length);
    let slice = cleaned.slice(i, end);
    // try to break on a paragraph/sentence boundary near the end
    if (end < cleaned.length) {
      const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
      if (breakAt > CHUNK_SIZE * 0.5) slice = slice.slice(0, breakAt + 1);
    }
    chunks.push(slice.trim());
    if (end >= cleaned.length) break;
    i += Math.max(slice.length - CHUNK_OVERLAP, 1);
  }
  return chunks.filter((c) => c.length > 0);
}

async function embedTexts(apiKey: string, inputs: string[]): Promise<number[][]> {
  const res = await fetch(
    `${GEMINI_URL}/models/${EMBED_MODEL}:batchEmbedContents?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: inputs.map((text) => ({
          model: `models/${EMBED_MODEL}`,
          content: { parts: [{ text }] },
        })),
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Embedding failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { embeddings: Array<{ values: number[] }> };
  return json.embeddings.map((e) => e.values);
}

async function extractTextWithGemini(
  geminiKey: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          {
            text: "Extract ALL readable text from this document, preserving headings and order. Output plain text only, no commentary, no markdown fences.",
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "text/plain" },
  };
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
  for (const model of models) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (r.ok) {
      const j = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text.trim()) return text;
    }
  }
  throw new Error("Could not extract text from this file.");
}

// ---------- list/admin ----------

export const listChatbotDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("chatbot_documents")
      .select("id, title, source_filename, mime_type, byte_size, status, error_message, chunk_count, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const deleteChatbotDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ documentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("chatbot_documents")
      .select("storage_path")
      .eq("id", data.documentId)
      .maybeSingle();
    if (doc?.storage_path) {
      await supabaseAdmin.storage.from("document-uploads").remove([doc.storage_path]);
    }
    const { error } = await supabaseAdmin.from("chatbot_documents").delete().eq("id", data.documentId);
    if (error) throw error;
    return { ok: true };
  });

export const ingestChatbotDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        storagePath: z.string().min(1).max(500),
        sourceFilename: z.string().min(1).max(300),
        mimeType: z.string().min(1).max(150),
        byteSize: z.number().int().nonnegative(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not configured");
    if (data.byteSize > MAX_BYTES) throw new Error("File is too large (max 10 MB).");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create the document row in processing state
    const { data: docRow, error: insErr } = await supabaseAdmin
      .from("chatbot_documents")
      .insert({
        title: data.title,
        source_filename: data.sourceFilename,
        storage_path: data.storagePath,
        mime_type: data.mimeType,
        byte_size: data.byteSize,
        status: "processing",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (insErr || !docRow) throw insErr ?? new Error("Could not create document row.");

    try {
      // Download file
      const { data: file, error: dlErr } = await supabaseAdmin.storage
        .from("document-uploads")
        .download(data.storagePath);
      if (dlErr || !file) throw new Error("Could not download uploaded file.");

      // Get text content
      let text: string;
      const isPlain =
        data.mimeType.startsWith("text/") ||
        data.sourceFilename.toLowerCase().endsWith(".md") ||
        data.sourceFilename.toLowerCase().endsWith(".txt");
      if (isPlain) {
        text = await file.text();
      } else {
        const buf = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
        const b64 = btoa(binary);
        text = await extractTextWithGemini(geminiKey, b64, data.mimeType);
      }

      const chunks = chunkText(text);
      if (chunks.length === 0) throw new Error("No readable text found in this file.");

      // Embed in batches of 50
      const BATCH = 50;
      const rows: Array<{ document_id: string; chunk_index: number; content: string; embedding: string; token_estimate: number }> = [];
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batch = chunks.slice(i, i + BATCH);
        const vectors = await embedTexts(geminiKey, batch);
        batch.forEach((c, j) => {
          rows.push({
            document_id: docRow.id,
            chunk_index: i + j,
            content: c,
            embedding: JSON.stringify(vectors[j]),
            token_estimate: Math.ceil(c.length / 4),
          });
        });
      }

      const { error: chunkErr } = await supabaseAdmin.from("chatbot_chunks").insert(rows);
      if (chunkErr) throw chunkErr;

      await supabaseAdmin
        .from("chatbot_documents")
        .update({ status: "ready", chunk_count: rows.length, error_message: null })
        .eq("id", docRow.id);

      return { ok: true, documentId: docRow.id, chunkCount: rows.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ingestion failed.";
      await supabaseAdmin
        .from("chatbot_documents")
        .update({ status: "error", error_message: message })
        .eq("id", docRow.id);
      throw new Error(message);
    }
  });

// ---------- visitor chat ----------

export const askChatbot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        conversationId: z.string().uuid().nullable().optional(),
        question: z.string().min(1).max(2000),
        language: z.string().min(2).max(50).optional(),
      })
      .parse(input),
  )

  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createPublicClient();

    // Ensure conversation exists
    let conversationId = data.conversationId ?? null;
    if (!conversationId) {
      const label = data.question.slice(0, 80);
      const { data: convo, error: convErr } = await supabase
        .from("chatbot_conversations")
        .insert({ visitor_label: label })
        .select("id")
        .single();
      if (convErr || !convo) throw convErr ?? new Error("Could not start conversation.");
      conversationId = convo.id;
    }

    // Store user message
    await supabase.from("chatbot_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: data.question,
    });

    // Embed question + retrieve
    const [qVector] = await embedTexts(lovableKey, [data.question]);
    const { data: matches, error: matchErr } = await supabase.rpc("match_chatbot_chunks", {
      query_embedding: JSON.stringify(qVector) as unknown as string,
      match_count: 5,
    });
    if (matchErr) throw matchErr;

    const relevant = (matches ?? []).filter((m: { similarity: number }) => m.similarity >= MIN_SIMILARITY);

    let answer: string;
    let sources: Array<{ document_id: string; title: string; snippet: string }> = [];

    if (relevant.length === 0) {
      answer =
        "I don't have that in my notes yet. You can use the **Get help** button above, or try asking something else.";
    } else {
      const contextText = relevant
        .map(
          (r: { document_title: string | null; content: string }, idx: number) =>
            `[${idx + 1}] (${r.document_title ?? "doc"})\n${r.content}`,
        )
        .join("\n\n---\n\n");

      const chatRes = await fetch(`${LOVABLE_AI_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": lovableKey,
          "X-Lovable-AIG-SDK": "vercel-ai-sdk",
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: [
            {
              role: "system",
              content:
                `You are a friendly assistant for The PLACE, a community help center. Answer the visitor's question using ONLY the provided context. Be warm, concise (1-4 short paragraphs), and plain-spoken. If the context does not contain the answer, reply: \"I don't have that in my notes yet — try the Get help button or ask something else.\" Do not invent details. Do not cite source numbers in your reply. Always write your reply in ${data.language ?? "English"}, even if the context is in another language.`,
            },

            {
              role: "user",
              content: `Context:\n${contextText}\n\nQuestion: ${data.question}`,
            },
          ],
          temperature: 0.3,
        }),
      });
      if (!chatRes.ok) {
        const body = await chatRes.text().catch(() => "");
        if (chatRes.status === 429) throw new Error("The assistant is busy right now. Please try again in a moment.");
        if (chatRes.status === 402) throw new Error("The assistant is temporarily unavailable.");
        throw new Error(`Chat failed (${chatRes.status}): ${body.slice(0, 200)}`);
      }
      const chatJson = (await chatRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
      answer = chatJson.choices?.[0]?.message?.content?.trim() || "I don't have an answer for that yet.";

      sources = relevant.map((r: { document_id: string; document_title: string | null; content: string }) => ({
        document_id: r.document_id,
        title: r.document_title ?? "Document",
        snippet: r.content.slice(0, 200),
      }));
    }

    // Save assistant message + bump conversation
    await supabase.from("chatbot_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: answer,
      sources,
    });
    await supabase
      .from("chatbot_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { conversationId, answer, sources };
  });

// ---------- admin: list conversations ----------

export const listChatbotConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("chatbot_conversations")
      .select("id, started_at, last_message_at, visitor_label, message_count")
      .order("last_message_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const getChatbotConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: messages, error } = await context.supabase
      .from("chatbot_messages")
      .select("id, role, content, sources, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return messages ?? [];
  });
