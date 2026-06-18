import { Volume2, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Fetches PCM audio from /api/tts (Gemini TTS, JSON response) and plays it
 * via Web Audio. Falls back to browser SpeechSynthesis on error.
 */
export function ReadAloudButton({
  text,
  language,
  label = "Listen",
}: {
  text: string;
  language?: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const abortRef = useRef<AbortController | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    abortRef.current?.abort();
    abortRef.current = null;
    try { sourceRef.current?.stop(); } catch { /* noop */ }
    sourceRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function fallbackBrowserTTS() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Audio is not available on this device.");
      setState("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    setState("playing");
    window.speechSynthesis.speak(u);
  }

  async function start() {
    setState("loading");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: language ?? "English" }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const { audioBase64, sampleRate } = (await res.json()) as {
        audioBase64: string;
        sampleRate: number;
      };

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const usable = bytes.length - (bytes.length % 2);
      const samples = new Int16Array(bytes.buffer, 0, usable / 2);
      const floats = Float32Array.from(samples, (s) => s / 32768);

      const rate = sampleRate || 24000;
      const ctx = new AudioContext({ sampleRate: rate });
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});

      const buffer = ctx.createBuffer(1, floats.length, rate);
      buffer.copyToChannel(floats, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      sourceRef.current = source;
      source.onended = () => {
        if (abortRef.current === controller) {
          cleanup();
          setState("idle");
        }
      };
      source.start();
      setState("playing");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error(err);
      cleanup();
      fallbackBrowserTTS();
    }
  }

  function stop() {
    cleanup();
    setState("idle");
  }

  function toggle() {
    if (state === "playing" || state === "loading") stop();
    else void start();
  }

  return (
    <Button
      type="button"
      variant="default"
      size="default"
      onClick={toggle}
      aria-label={label}
      className="gap-2 rounded-full px-5 py-2.5 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
    >
      {state === "loading" ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-5 w-5 fill-current" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
      <span>{state === "playing" ? "Stop" : label}</span>
    </Button>
  );
}
