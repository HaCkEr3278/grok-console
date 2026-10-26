"use client";

import { useEffect, useRef } from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ComposerProps = {
  value: string;
  streaming: boolean;
  modelLabel: string;
  demo: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

export function Composer({
  value,
  streaming,
  modelLabel,
  demo,
  onChange,
  onSend,
  onStop,
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 220)}px`;
  }, [value]);

  return (
    <div className="border-t border-white/10 bg-[#0c0b0a]/90 px-4 py-4 backdrop-blur">
      <form
        className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-[#161412] p-2 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]"
        onSubmit={(event) => {
          event.preventDefault();
          if (streaming) onStop();
          else onSend();
        }}
      >
        <Textarea
          ref={ref}
          data-testid="composer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            demo
              ? "Demo mode — ask anything, or paste a key in Controls"
              : `Message ${modelLabel}`
          }
          rows={1}
          className="max-h-52 min-h-12 resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!streaming) onSend();
            }
            if (event.key === "Escape" && streaming) {
              onStop();
            }
          }}
        />
        <Button
          type="submit"
          size="icon-lg"
          className="mb-0.5 rounded-full"
          disabled={!streaming && !value.trim()}
          aria-label={streaming ? "Stop generating" : "Send message"}
        >
          {streaming ? <SquareIcon className="size-3.5" /> : <ArrowUpIcon />}
        </Button>
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-zinc-500">
        Enter to send · Shift+Enter for a new line · Esc to stop
      </p>
    </div>
  );
}
