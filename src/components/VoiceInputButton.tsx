import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Voice input button. MVP placeholder using the browser SpeechRecognition API
 * where available. Designed so a future release can swap to a multilingual
 * speech-to-text service without changing call sites.
 */
export function VoiceInputButton({ onTranscript, label = "Speak your answer" }: { onTranscript: (text: string) => void; label?: string }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  function toggle() {
    if (!supported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      if (text) onTranscript(text);
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-11 w-11 rounded-full"
      onClick={toggle}
      disabled={!supported}
      aria-label={label}
      title={supported ? label : "Voice input coming soon"}
    >
      {listening ? <MicOff className="h-5 w-5 text-accent" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
}
