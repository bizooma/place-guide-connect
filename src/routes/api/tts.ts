import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  text: z.string().min(1).max(4000),
  language: z.string().min(2).max(50).optional(),
});

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return new Response("OPENAI_API_KEY not configured", { status: 500 });

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        const lang = parsed.language ?? "English";
        const instructions = `Speak the text aloud in ${lang} with a calm, warm, easy-to-follow pace. Pronounce naturally for native ${lang} speakers.`;

        try {
          const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini-tts",
              input: parsed.text,
              voice: "alloy",
              instructions,
              response_format: "mp3",
            }),
            signal: request.signal,
          });

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            console.error("[tts] openai error", upstream.status, text);
            return new Response("TTS failed", { status: upstream.status });
          }

          const buf = await upstream.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const audioBase64 = btoa(binary);

          return Response.json({ audioBase64, mimeType: "audio/mpeg" });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          console.error("[tts] error", err);
          return new Response("TTS error", { status: 500 });
        }
      },
    },
  },
});
