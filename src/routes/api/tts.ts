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
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("LOVABLE_API_KEY not configured", { status: 500 });

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        const lang = parsed.language ?? "English";
        const instructions = `Speak naturally and warmly in ${lang}, at a calm, easy-to-follow pace.`;

        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: parsed.text,
              voice: "alloy",
              instructions,
              stream_format: "sse",
              response_format: "pcm",
            }),
            signal: request.signal,
          });

          if (!upstream.ok || !upstream.body) {
            const text = await upstream.text().catch(() => "");
            console.error("[tts] gateway error", upstream.status, text);
            return new Response("TTS failed", { status: upstream.status });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          console.error("[tts] error", err);
          return new Response("TTS error", { status: 500 });
        }
      },
    },
  },
});
