import { Volume2, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Fetches mp3 audio from /api/tts (Lovable AI Gateway, base64 JSON) and plays
 * it via an <audio> element. Falls back to browser SpeechSynthesis on error.
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* noop */ }
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
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

    // Create the audio element synchronously inside the user gesture so iOS
    // Safari permits playback after the upcoming await.
    const audio = new Audio();
    audioRef.current = audio;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: language ?? "English" }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const { audioBase64, mimeType } = (await res.json()) as {
        audioBase64: string;
        mimeType?: string;
      };

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType || "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      audio.src = url;
      audio.onended = () => {
        if (abortRef.current === controller) {
          cleanup();
          setState("idle");
        }
      };
      await audio.play();
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
