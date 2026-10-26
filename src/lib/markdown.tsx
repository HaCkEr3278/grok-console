import { Fragment, type ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`t-${key++}`}>{text.slice(last, match.index)}</Fragment>,
      );
    }
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="rounded-md bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={`b-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a
            key={`a-${key++}`}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {link[1]}
          </a>,
        );
      }
    } else {
      nodes.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(<Fragment key={`t-${key++}`}>{text.slice(last)}</Fragment>);
  }
  return nodes;
}

function renderBlock(block: string, key: number) {
  if (block.startsWith("```")) {
    const newline = block.indexOf("\n");
    const code =
      newline === -1 ? block.replace(/^```|```$/g, "") : block.slice(newline + 1, -3);
    return (
      <pre
        key={key}
        className="overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-[13px] leading-6 text-zinc-100"
      >
        <code>{code.replace(/\n$/, "")}</code>
      </pre>
    );
  }

  const lines = block.split("\n");
  if (lines.every((line) => /^\s*[-*]\s+/.test(line) || line.trim() === "")) {
    return (
      <ul key={key} className="list-disc space-y-1 pl-5">
        {lines
          .filter((line) => line.trim())
          .map((line, index) => (
            <li key={index}>{renderInline(line.replace(/^\s*[-*]\s+/, ""))}</li>
          ))}
      </ul>
    );
  }

  if (lines.every((line) => /^\s*\d+\.\s+/.test(line) || line.trim() === "")) {
    return (
      <ol key={key} className="list-decimal space-y-1 pl-5">
        {lines
          .filter((line) => line.trim())
          .map((line, index) => (
            <li key={index}>
              {renderInline(line.replace(/^\s*\d+\.\s+/, ""))}
            </li>
          ))}
      </ol>
    );
  }

  if (lines[0]?.startsWith("# ")) {
    return (
      <h3 key={key} className="text-lg font-semibold tracking-tight">
        {renderInline(lines[0].slice(2))}
      </h3>
    );
  }

  return (
    <p key={key} className="whitespace-pre-wrap">
      {renderInline(block)}
    </p>
  );
}

export function MarkdownMessage({ text }: { text: string }) {
  const chunks: string[] = [];
  const fence = /```[\s\S]*?```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(text))) {
    if (match.index > last) {
      chunks.push(...text.slice(last, match.index).split(/\n{2,}/));
    }
    chunks.push(match[0]);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    chunks.push(...text.slice(last).split(/\n{2,}/));
  }

  return (
    <div className="space-y-3 text-[15px] leading-7 text-zinc-100">
      {chunks
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk, index) => renderBlock(chunk, index))}
    </div>
  );
}
