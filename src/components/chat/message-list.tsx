"use client";

import { useEffect, useRef } from "react";
import { CopyIcon, RefreshCwIcon, SparklesIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/lib/markdown";
import type { ChatMessage } from "@/lib/types";

type MessageListProps = {
  messages: ChatMessage[];
  streaming: boolean;
  onRegenerate?: () => void;
  suggestions: string[];
  onSuggestion: (text: string) => void;
};

export function MessageList({
  messages,
  streaming,
  onRegenerate,
  suggestions,
  onSuggestion,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-300 text-[#16140f] shadow-[0_0_40px_rgba(252,211,77,0.25)]">
          <SparklesIcon className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Talk to Grok here
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
          This webpage is the desk. Paste an xAI key in Controls to go live.
          Until then, Demo mode still streams so you can learn the layout.
        </p>
        <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              data-testid="suggestion"
              onClick={() => onSuggestion(suggestion)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-zinc-200 transition hover:border-amber-200/40 hover:bg-white/10"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const isLastAssistant =
          !isUser && lastAssistant?.id === message.id && !streaming;
        return (
          <article key={message.id} className="flex gap-3">
            <div
              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                isUser
                  ? "bg-zinc-800 text-zinc-200"
                  : "bg-amber-300 text-[#16140f]"
              }`}
            >
              {isUser ? (
                <UserIcon className="size-4" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {isUser ? "You" : "Grok"}
              </p>
              {isUser ? (
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-100">
                  {message.content}
                </p>
              ) : message.content ? (
                <MarkdownMessage text={message.content} />
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                  <span className="size-2 animate-pulse rounded-full bg-amber-300" />
                  Thinking
                </span>
              )}
              {message.reasoning ? (
                <details className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400">
                  <summary className="cursor-pointer text-xs tracking-wide text-zinc-500 uppercase">
                    Reasoning
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap">{message.reasoning}</p>
                </details>
              ) : null}
              {message.error ? (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {message.error}
                </p>
              ) : null}
              {!isUser && message.content ? (
                <div className="mt-2 flex gap-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={async () => {
                      await navigator.clipboard.writeText(message.content);
                      toast.success("Copied reply");
                    }}
                  >
                    <CopyIcon />
                    Copy
                  </Button>
                  {isLastAssistant && onRegenerate ? (
                    <Button size="xs" variant="ghost" onClick={onRegenerate}>
                      <RefreshCwIcon />
                      Regenerate
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
