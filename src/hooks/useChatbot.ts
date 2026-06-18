import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askChatbot } from "@/lib/chatbot.functions";
import { useI18n, SUPPORTED_LANGUAGES } from "@/lib/i18n";

export interface ChatbotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  language?: string;
}

const STORAGE_KEY = "place-chatbot-convo";

export function useChatbot() {
  const ask = useServerFn(askChatbot);
  const { language } = useI18n();
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "submitted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) conversationIdRef.current = stored;
    } catch {
      // ignore
    }
  }, []);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || status === "submitted") return;
      setError(null);
      const userId = crypto.randomUUID();
      setMessages((m) => [...m, { id: userId, role: "user", content: trimmed }]);
      setStatus("submitted");
      try {
        const langName = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name ?? "English";
        const res = await ask({
          data: { question: trimmed, conversationId: conversationIdRef.current, language: langName },
        });
        conversationIdRef.current = res.conversationId;
        try {
          sessionStorage.setItem(STORAGE_KEY, res.conversationId);
        } catch {
          // ignore
        }
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res.answer, language: langName }]);
        setStatus("idle");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: `Sorry — ${message}` },
        ]);
        setStatus("error");
      }
    },
    [ask, status, language],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus("idle");
    conversationIdRef.current = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { messages, status, error, send, reset };
}
