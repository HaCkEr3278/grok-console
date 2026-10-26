"use client";

import {
  MoreHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/lib/types";

type SidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function Sidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onDelete,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-[#12110f]">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-300 text-[#16140f]">
          <SparklesIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            Grok Console
          </p>
          <p className="truncate text-xs text-zinc-500">Browser desk</p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button className="w-full" onClick={onNew}>
          <PlusIcon />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 pb-4">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-sm text-zinc-500">
            No threads yet. Start one and it will land here.
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center rounded-lg ${
                    active ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
                  >
                    {conversation.title}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="mr-1 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                        aria-label="Chat actions"
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(conversation.id)}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
