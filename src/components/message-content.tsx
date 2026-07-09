"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js";
import { Check, Copy } from "lucide-react";

function CodeBlock({ className, code }: { className?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className ?? "")?.[1];
  const trimmed = code.replace(/\n$/, "");

  let highlighted: string | null = null;
  try {
    highlighted =
      language && hljs.getLanguage(language)
        ? hljs.highlight(trimmed, { language }).value
        : hljs.highlightAuto(trimmed).value;
  } catch {
    highlighted = null;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(trimmed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{language ?? "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        {highlighted !== null ? (
          <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <code>{trimmed}</code>
        )}
      </pre>
    </div>
  );
}

/**
 * Renders assistant (and user) message text as markdown with syntax-
 * highlighted code blocks. Safe to re-render on every streamed token: partial/
 * unclosed markdown (e.g. an open code fence mid-stream) just renders as its
 * best-effort interpretation and settles once the rest of the text arrives.
 */
export function MessageContent({ content }: { content: string }) {
  return (
    <div
      className="markdown-body min-w-0 wrap-break-word text-sm [&_a]:text-accent [&_a]:underline
      [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground
      [&_code:not(pre_code)]:rounded-md [&_code:not(pre_code)]:bg-muted [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:text-[0.85em]
      [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5
      [&_p]:mb-2 [&_p:last-child]:mb-0
      [&_strong]:font-semibold
      [&_table]:w-full [&_table]:border-collapse
      [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1
      [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1
      [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children);
            const isBlock = className?.includes("language-") || text.includes("\n");
            if (!isBlock) return <code className={className}>{children}</code>;
            return <CodeBlock className={className} code={text} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
