import { Volume2, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Read-aloud button. MVP uses the browser SpeechSynthesis API.
 * Architected so a higher-quality multilingual TTS can replace it later.
 */
export function ReadAloudButton({ text, label = "Listen" }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function toggle() {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={!supported}
      aria-label={label}
      className="gap-2 text-primary-deep hover:bg-secondary"
    >
      {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span className="text-sm">{label}</span>
    </Button>
  );
}
