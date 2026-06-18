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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return new Response("GEMINI_API_KEY not configured", { status: 500 });

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        const lang = parsed.language ?? "English";
        const prompt = `Read the following text aloud naturally and warmly in ${lang}, at a calm, easy-to-follow pace:\n\n${parsed.text}`;

        try {
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
                  },
                },
              }),
              signal: request.signal,
            },
          );

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            console.error("[tts] gemini error", upstream.status, text);
            return new Response("TTS failed", { status: upstream.status });
          }

          const json = (await upstream.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
            }>;
          };
          const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
          const audioBase64 = part?.inlineData?.data;
          const mimeType = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";
          if (!audioBase64) {
            console.error("[tts] no audio in response", JSON.stringify(json).slice(0, 500));
            return new Response("TTS empty", { status: 502 });
          }

          // Parse sample rate from mime (e.g. "audio/L16;codecs=pcm;rate=24000")
          const rateMatch = /rate=(\d+)/i.exec(mimeType);
          const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

          return Response.json({ audioBase64, sampleRate, mimeType });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          console.error("[tts] error", err);
          return new Response("TTS error", { status: 500 });
        }
      },
    },
  },
});
