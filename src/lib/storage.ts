import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from "@/lib/models";
import type { Conversation, GrokSettings } from "@/lib/types";

const STORE_KEY = "grok-console.v1";

export const defaultSettings = (): GrokSettings => ({
  apiKey: "",
  model: DEFAULT_MODEL,
  temperature: 0.7,
  topP: 1,
  maxTokens: 0,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  liveSearch: "off",
  reasoningEffort: "high",
  stream: true,
});

export type PersistedStore = {
  conversations: Conversation[];
  activeId: string | null;
  settings: GrokSettings;
};

export const emptyStore = (): PersistedStore => ({
  conversations: [],
  activeId: null,
  settings: defaultSettings(),
});

export function loadStore(): PersistedStore {
  if (typeof window === "undefined") return emptyStore();

  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    return {
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      activeId: parsed.activeId ?? null,
      settings: { ...defaultSettings(), ...(parsed.settings ?? {}) },
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: PersistedStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

type Listener = () => void;
const listeners = new Set<Listener>();
let memory: PersistedStore | null = null;

function emit() {
  for (const listener of listeners) listener();
}

export function getClientStore() {
  if (!memory) memory = loadStore();
  return memory;
}

const SERVER_STORE = emptyStore();

export function getServerStore() {
  return SERVER_STORE;
}

export function subscribeStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPersistedStore(
  next: PersistedStore | ((current: PersistedStore) => PersistedStore),
) {
  const current = getClientStore();
  memory = typeof next === "function" ? next(current) : next;
  saveStore(memory);
  emit();
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function titleFromPrompt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}
