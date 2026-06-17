import { useEffect, useRef, useState } from "react";
import { Sparkles, MessageCircle } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useChatbot } from "@/hooks/useChatbot";

const STARTERS = [
  "What classes are offered?",
  "What hours are you open?",
  "How can I get help with a bill?",
  "Where are you located?",
];

export function HeroChat() {
  const { messages, status, send } = useChatbot();
  const isLoading = status === "submitted";
  const submitStatus = status === "submitted" ? "submitted" : undefined;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  function handleSubmit(message: PromptInputMessage) {
    void send(message.text);
  }

  function handleStarter(q: string) {
    void send(q);
  }

  return (
    <div className="flex h-full max-h-[560px] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <header className="flex items-center gap-2 border-b border-border bg-white px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-accent">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold text-primary-deep">
            Ask The PLACE
          </div>
          <div className="text-[11px] text-muted-foreground">
            Answers based on our community info
          </div>
        </div>
      </header>

      <Conversation className="flex-1 bg-white">
        <ConversationContent className="px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm text-foreground">
                  Hi — I can answer questions about The PLACE: classes, hours, services, and how to get help. What can I help you with?
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStarter(s)}
                    className="rounded-full border border-border bg-warm px-3 py-1.5 text-xs text-primary-deep transition hover:bg-warm/70 hover:shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.role === "assistant" ? (
                  <MessageResponse>{m.content}</MessageResponse>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </MessageContent>
            </Message>
          ))}
          {isLoading && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-white p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Ask a question…"
            disabled={isLoading}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={submitStatus} disabled={isLoading} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
