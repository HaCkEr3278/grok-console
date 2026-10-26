import { GROK_MODELS, supportsReasoningEffort, type GrokModel } from "@/lib/models";
import type { GrokSettings } from "@/lib/types";

export const XAI_API_BASE = "https://api.x.ai/v1";

export type ChatTurn = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function readXaiError(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof json.error === "string") return json.error;
    if (json.error?.message) return json.error.message;
    if (json.message) return json.message;
  } catch {
    // fall through
  }
  return text.slice(0, 400) || `xAI returned HTTP ${response.status}`;
}

export function buildChatPayload(
  settings: GrokSettings,
  turns: ChatTurn[],
): Record<string, unknown> {
  const systemPrompt = settings.systemPrompt.trim();
  const messages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...turns]
    : turns;

  const payload: Record<string, unknown> = {
    model: settings.model,
    messages,
    temperature: settings.temperature,
    top_p: settings.topP,
    stream: settings.stream,
    n: 1,
  };

  if (settings.maxTokens > 0) {
    payload.max_completion_tokens = Math.round(settings.maxTokens);
  }
  if (settings.stream) {
    payload.stream_options = { include_usage: true };
  }
  payload.search_parameters = { mode: settings.liveSearch };

  if (supportsReasoningEffort(settings.model)) {
    payload.reasoning_effort = settings.reasoningEffort;
  }

  return payload;
}

export async function grokChat(
  settings: GrokSettings,
  turns: ChatTurn[],
  signal: AbortSignal,
) {
  const key = settings.apiKey.trim();
  if (!key) {
    throw new Error("Add an xAI API key in Controls.");
  }

  const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildChatPayload(settings, turns)),
    signal,
  });

  if (!response.ok) {
    throw new Error(await readXaiError(response));
  }

  return response;
}

export async function grokModels(apiKey: string): Promise<GrokModel[]> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("Paste an xAI API key first.");
  }

  const response = await fetch(`${XAI_API_BASE}/models`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    throw new Error(await readXaiError(response));
  }

  const payload = (await response.json()) as { data?: { id?: string }[] };
  const ids = (payload.data ?? [])
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));
  const grokIds = ids.filter((id) => id.startsWith("grok-"));
  const known = new Set(GROK_MODELS.map((model) => model.id));
  const extras = grokIds
    .filter((id) => !known.has(id))
    .slice(0, 20)
    .map((id) => ({ id, label: id, hint: "From your xAI account" }));

  return [...GROK_MODELS, ...extras];
}

export async function readSseStream(
  response: Response,
  onDelta: (content: string, reasoning: string) => void,
) {
  if (!response.body) {
    throw new Error("No stream from Grok.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as {
            choices?: {
              delta?: { content?: string; reasoning_content?: string };
            }[];
          };
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) content += delta.content;
          if (delta?.reasoning_content) reasoning += delta.reasoning_content;
          onDelta(content, reasoning);
        } catch {
          // ignore keep-alives
        }
      }
    }
  }

  return { content, reasoning };
}
