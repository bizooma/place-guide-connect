import { Volume2, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createParser } from "eventsource-parser";

/**
 * Streams PCM audio chunks from /api/tts (Lovable AI Gateway, SSE) and plays
 * them as they arrive via Web Audio. Falls back to browser SpeechSynthesis.
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
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    abortRef.current?.abort();
    abortRef.current = null;
    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch { /* noop */ }
    });
    sourcesRef.current = [];
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

    const ctx = new AudioContext({ sampleRate: 24000 });
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});

    let playhead = 0;
    let pending = new Uint8Array(0);
    let started = false;

    const playChunk = (incoming: Uint8Array) => {
      if (!ctxRef.current) return;
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending);
      bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      pending = bytes.slice(usable);
      if (usable === 0) return;
      const samples = new Int16Array(bytes.buffer, 0, usable / 2);
      const floats = Float32Array.from(samples, (s) => s / 32768);
      const buffer = ctx.createBuffer(1, floats.length, 24000);
      buffer.copyToChannel(floats, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      if (playhead === 0) playhead = ctx.currentTime + 0.05;
      else playhead = Math.max(playhead, ctx.currentTime);
      source.start(playhead);
      playhead += buffer.duration;
      sourcesRef.current.push(source);
      if (!started) {
        started = true;
        setState("playing");
      }
      const lastEnd = playhead;
      source.onended = () => {
        if (ctxRef.current && ctx.currentTime >= lastEnd - 0.05) {
          setState((s) => (s === "playing" ? "idle" : s));
        }
      };
    };

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: language ?? "English" }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`TTS ${res.status}`);

      const parser = createParser({
        onEvent(event) {
          let payload: { type: string; audio?: string };
          try { payload = JSON.parse(event.data); } catch { return; }
          if (payload.type !== "speech.audio.delta" || !payload.audio) return;
          const binary = atob(payload.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          playChunk(bytes);
        },
      });

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.feed(value);
      }
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
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={label}
      className="gap-2 text-primary-deep hover:bg-secondary"
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span className="text-sm">{label}</span>
    </Button>
  );
}
