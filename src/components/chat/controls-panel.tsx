"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2Icon, PlugZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { GROK_MODELS, supportsReasoningEffort, type GrokModel } from "@/lib/models";
import { defaultSettings } from "@/lib/storage";
import type { ConnectionState, GrokSettings } from "@/lib/types";

type ControlsPanelProps = {
  settings: GrokSettings;
  connection: ConnectionState;
  extraModels: GrokModel[];
  testing: boolean;
  onChange: (next: GrokSettings) => void;
  onTest: () => void;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-xs tracking-wide text-zinc-300 uppercase">
          {label}
        </Label>
        {hint ? (
          <span className="font-mono text-[11px] text-zinc-500">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ControlsPanel({
  settings,
  connection,
  extraModels,
  testing,
  onChange,
  onTest,
}: ControlsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const models = [...GROK_MODELS, ...extraModels];
  const patch = (partial: Partial<GrokSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-xs font-medium tracking-[0.18em] text-amber-200/80 uppercase">
          Controls
        </p>
        <h2 className="mt-1 text-base font-medium">Grok cockpit</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Same knobs as a desktop client. Your xAI key stays in this browser
          and is sent only to api.x.ai.
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <Field label="Connection">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div>
              <p className="text-sm text-zinc-200">
                {connection === "ready"
                  ? "Live Grok"
                  : connection === "error"
                    ? "Key rejected"
                    : "Demo mode"}
              </p>
              <p className="text-xs text-zinc-500">
                {settings.apiKey.trim()
                  ? "Key saved on this device"
                  : "Paste an xAI key below to go live"}
              </p>
            </div>
            <Badge variant={connection === "ready" ? "default" : "outline"}>
              {connection === "ready" ? "Live" : "Demo"}
            </Badge>
          </div>
        </Field>

        <Field label="xAI API key">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder="xai-..."
              value={settings.apiKey}
              onChange={(event) => patch({ apiKey: event.target.value })}
              className="pr-9 font-mono"
            />
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="absolute top-1 right-1"
              onClick={() => setShowKey((value) => !value)}
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={onTest}
            disabled={testing || !settings.apiKey.trim()}
          >
            {testing ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <PlugZapIcon />
            )}
            Test connection
          </Button>
        </Field>

        <Separator />

        <Field label="Model">
          <Select
            value={settings.model}
            onValueChange={(model) => patch({ model })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="flex flex-col text-left">
                    <span>{model.label}</span>
                    <span className="text-[11px] text-zinc-500">
                      {model.hint}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Temperature" hint={settings.temperature.toFixed(2)}>
          <Slider
            min={0}
            max={2}
            step={0.05}
            value={[settings.temperature]}
            onValueChange={([temperature]) => patch({ temperature })}
          />
        </Field>

        <Field label="Top P" hint={settings.topP.toFixed(2)}>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[settings.topP]}
            onValueChange={([topP]) => patch({ topP })}
          />
        </Field>

        <Field
          label="Max tokens"
          hint={settings.maxTokens === 0 ? "model default" : String(settings.maxTokens)}
        >
          <Slider
            min={0}
            max={8192}
            step={64}
            value={[settings.maxTokens]}
            onValueChange={([maxTokens]) => patch({ maxTokens })}
          />
        </Field>

        <Field label="Live search">
          <Select
            value={settings.liveSearch}
            onValueChange={(liveSearch) =>
              patch({ liveSearch: liveSearch as GrokSettings["liveSearch"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off — no web or X lookup</SelectItem>
              <SelectItem value="auto">Auto — Grok decides</SelectItem>
              <SelectItem value="on">On — search every turn</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {supportsReasoningEffort(settings.model) ? (
          <Field label="Reasoning effort">
            <Select
              value={settings.reasoningEffort}
              onValueChange={(reasoningEffort) =>
                patch({
                  reasoningEffort:
                    reasoningEffort as GrokSettings["reasoningEffort"],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <Field label="Stream replies">
          <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
            <span className="text-sm text-zinc-300">Token by token</span>
            <Switch
              checked={settings.stream}
              onCheckedChange={(stream) => patch({ stream })}
            />
          </div>
        </Field>

        <Field label="System prompt">
          <Textarea
            value={settings.systemPrompt}
            onChange={(event) => patch({ systemPrompt: event.target.value })}
            className="min-h-32"
          />
        </Field>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-zinc-400"
          onClick={() =>
            onChange({
              ...defaultSettings(),
              apiKey: settings.apiKey,
            })
          }
        >
          Reset knobs
        </Button>
      </div>
    </div>
  );
}
