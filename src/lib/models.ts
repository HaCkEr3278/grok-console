export type GrokModel = {
  id: string;
  label: string;
  hint: string;
};

export const GROK_MODELS: GrokModel[] = [
  { id: "grok-4.7", label: "Grok 4.7", hint: "Flagship · 500k context" },
  { id: "grok-4.6", label: "Grok 4.6", hint: "Previous flagship" },
  { id: "grok-4.5", label: "Grok 4.5", hint: "Strong general model" },
  { id: "grok-4.3", label: "Grok 4.3", hint: "1M context · reasoning" },
  { id: "grok-4", label: "Grok 4", hint: "Stable alias" },
  { id: "grok-3", label: "Grok 3", hint: "Fast everyday chat" },
  { id: "grok-3-mini", label: "Grok 3 Mini", hint: "Lightweight" },
];

export const DEFAULT_MODEL = "grok-4.7";

export const DEFAULT_SYSTEM_PROMPT =
  "You are Grok, a helpful and maximally truthful assistant built by xAI. Be direct. Use wit when it helps. Do not pad answers with filler.";

export function modelLabel(id: string, extras: GrokModel[] = []) {
  return (
    GROK_MODELS.find((model) => model.id === id)?.label ??
    extras.find((model) => model.id === id)?.label ??
    id
  );
}

export function supportsReasoningEffort(model: string) {
  return /grok-4\.(3|7|20)/.test(model);
}
