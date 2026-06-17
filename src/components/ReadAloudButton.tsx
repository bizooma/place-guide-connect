import { Volume2, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Read-aloud button. Streams natural-sounding multilingual audio from /api/tts
 * (powered by Gemini TTS). Falls back to the browser SpeechSynthesis API if
 * the network request fails.
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: language ?? "English" }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      setState("playing");
      await audio.play();
    } catch (err) {
      console.error(err);
      fallbackBrowserTTS();
    }
  }

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setState("idle");
  }

  function toggle() {
    if (state === "playing") stop();
    else if (state === "idle") void start();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={state === "loading"}
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
