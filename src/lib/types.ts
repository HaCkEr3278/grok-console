export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  createdAt: number;
  error?: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type LiveSearchMode = "off" | "auto" | "on";
export type ReasoningEffort = "none" | "low" | "medium" | "high";

export type GrokSettings = {
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  liveSearch: LiveSearchMode;
  reasoningEffort: ReasoningEffort;
  stream: boolean;
};

export type ConnectionState = "unknown" | "demo" | "ready" | "error";
