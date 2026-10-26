"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MenuIcon, SlidersHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { Composer } from "@/components/chat/composer";
import { ControlsPanel } from "@/components/chat/controls-panel";
import { MessageList } from "@/components/chat/message-list";
import { Sidebar } from "@/components/chat/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GROK_MODELS, modelLabel, type GrokModel } from "@/lib/models";
import { demoReply, streamDemoText } from "@/lib/demo";
import {
  getClientStore,
  getServerStore,
  newId,
  setPersistedStore,
  subscribeStore,
  titleFromPrompt,
} from "@/lib/storage";
import type {
  ChatMessage,
  ConnectionState,
  Conversation,
  GrokSettings,
} from "@/lib/types";
import { grokChat, grokModels, readSseStream } from "@/lib/xai";

const SUGGESTIONS = [
  "How does this app work?",
  "Hello — what can you do from this page?",
  "Help me write a short commit message.",
];

function sortConversations(list: Conversation[]) {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function ChatApp() {
  const store = useSyncExternalStore(
    subscribeStore,
    getClientStore,
    getServerStore,
  );
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [extraModels, setExtraModels] = useState<GrokModel[]>([]);
  const [testing, setTesting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const desktop = useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(min-width: 1024px)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.setAttribute("data-ready", "true");
  }, []);

  const settings = store.settings;
  const live = Boolean(settings.apiKey.trim());
  const connection: ConnectionState = !live
    ? "demo"
    : connectError
      ? "error"
      : "ready";

  const conversations = store.conversations;
  const active = conversations.find((item) => item.id === store.activeId);
  const messages = active?.messages ?? [];

  const updateSettings = (next: GrokSettings) => {
    setConnectError(null);
    setPersistedStore((current) => ({ ...current, settings: next }));
  };

  const ensureConversation = useCallback(
    (prompt: string): Conversation => {
      if (active) {
        if (active.title === "New chat") {
          const titled = {
            ...active,
            title: titleFromPrompt(prompt),
            updatedAt: Date.now(),
          };
          setPersistedStore((current) => ({
            ...current,
            conversations: current.conversations.map((item) =>
              item.id === titled.id ? titled : item,
            ),
          }));
          return titled;
        }
        return active;
      }
      const created: Conversation = {
        id: newId(),
        title: titleFromPrompt(prompt),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setPersistedStore((current) => ({
        ...current,
        activeId: created.id,
        conversations: [created, ...current.conversations],
      }));
      return created;
    },
    [active],
  );

  const patchConversation = (
    id: string,
    updater: (conversation: Conversation) => Conversation,
  ) => {
    setPersistedStore((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === id ? updater(item) : item,
      ),
    }));
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const runTurn = async (
    conversation: Conversation,
    nextMessages: ChatMessage[],
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    const assistantId = newId();
    const assistant: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    patchConversation(conversation.id, (item) => ({
      ...item,
      updatedAt: Date.now(),
      messages: [...nextMessages, assistant],
    }));

    const writeAssistant = (partial: Partial<ChatMessage>) => {
      patchConversation(conversation.id, (item) => ({
        ...item,
        messages: item.messages.map((message) =>
          message.id === assistantId ? { ...message, ...partial } : message,
        ),
      }));
    };

    try {
      if (!live) {
        await streamDemoText(
          demoReply(nextMessages.at(-1)?.content ?? ""),
          (chunk) => {
            assistant.content += chunk;
            writeAssistant({ content: assistant.content });
          },
          controller.signal,
        );
        return;
      }

      const response = await grokChat(
        settings,
        nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        controller.signal,
      );

      if (settings.stream) {
        const result = await readSseStream(response, (content, reasoning) => {
          writeAssistant({ content, reasoning });
        });
        writeAssistant(result);
      } else {
        const json = (await response.json()) as {
          content?: string;
          reasoning?: string;
        };
        writeAssistant({
          content: json.content ?? "",
          reasoning: json.reasoning ?? "",
        });
      }
      setConnectError(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Grok did not respond.";
      writeAssistant({
        error: message,
        content: assistant.content,
      });
      if (live) setConnectError(message);
      toast.error(message);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setStreaming(false);
    }
  };

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || streaming) return;
    setDraft("");
    const conversation = ensureConversation(prompt);
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    };
    const nextMessages = [
      ...(conversation.id === active?.id ? active.messages : []),
      userMessage,
    ];
    await runTurn(conversation, nextMessages);
  };

  const regenerate = async () => {
    if (!active || streaming) return;
    const trimmed = [...active.messages];
    while (trimmed.length && trimmed[trimmed.length - 1]?.role === "assistant") {
      trimmed.pop();
    }
    if (trimmed.length === 0) return;
    await runTurn(active, trimmed);
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const models = await grokModels(settings.apiKey);
      setExtraModels(models);
      setConnectError(null);
      toast.success("Connected to xAI. This window is live Grok.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not reach xAI.";
      setConnectError(message);
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  const newChat = () => {
    stop();
    setDraft("");
    setPersistedStore((current) => ({ ...current, activeId: null }));
    setSidebarOpen(false);
  };

  const headerModel = useMemo(
    () => modelLabel(settings.model, extraModels),
    [settings.model, extraModels],
  );

  const sidebar = (
    <Sidebar
      conversations={sortConversations(conversations)}
      activeId={store.activeId}
      onNew={newChat}
      onSelect={(id) => {
        stop();
        setPersistedStore((current) => ({ ...current, activeId: id }));
        setSidebarOpen(false);
      }}
      onDelete={(id) => {
        setPersistedStore((current) => {
          const conversationsNext = current.conversations.filter(
            (item) => item.id !== id,
          );
          return {
            ...current,
            conversations: conversationsNext,
            activeId:
              current.activeId === id
                ? (conversationsNext[0]?.id ?? null)
                : current.activeId,
          };
        });
      }}
    />
  );

  const controls = (
    <ControlsPanel
      settings={settings}
      connection={connection}
      extraModels={extraModels.filter(
        (model) => !GROK_MODELS.some((known) => known.id === model.id),
      )}
      testing={testing}
      onChange={updateSettings}
      onTest={testConnection}
    />
  );

  return (
    <div
      ref={rootRef}
      data-testid="grok-console"
      className="flex h-dvh overflow-hidden bg-[#0c0b0a] text-zinc-100"
    >
      <aside className="hidden w-72 shrink-0 border-r border-white/10 lg:block">
        {sidebar}
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Chats</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open chats"
          >
            <MenuIcon />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {active?.title ?? "New chat"}
            </p>
            <p className="truncate text-xs text-zinc-500">{headerModel}</p>
          </div>
          <Badge variant={connection === "ready" ? "default" : "outline"}>
            {connection === "ready" ? "Live Grok" : "Demo"}
          </Badge>
          <Button
            size="icon"
            variant={desktop ? "outline" : "ghost"}
            className="xl:hidden"
            onClick={() => setControlsOpen(true)}
            aria-label="Open controls"
          >
            <SlidersHorizontalIcon />
          </Button>
        </header>

        <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            streaming={streaming}
            onRegenerate={regenerate}
            suggestions={SUGGESTIONS}
            onSuggestion={send}
          />
        </div>

        <Composer
          value={draft}
          streaming={streaming}
          modelLabel={headerModel}
          demo={connection !== "ready"}
          onChange={setDraft}
          onSend={() => send(draft)}
          onStop={stop}
        />
      </section>

      <aside className="hidden w-80 shrink-0 border-l border-white/10 xl:block">
        {controls}
      </aside>

      <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Controls</SheetTitle>
          </SheetHeader>
          {controls}
        </SheetContent>
      </Sheet>
    </div>
  );
}
