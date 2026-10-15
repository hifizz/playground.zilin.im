"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowUp, Check, ChevronDown, Info, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS, MODELS } from "./data";
import { AppGlyph } from "./icons";
import { useDismiss } from "./use-dismiss";

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ab-line px-1 font-sans text-[10px] leading-4 text-ab-faint">{children}</kbd>
  );
}

export function IconButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-ab-mute transition-colors hover:bg-ab-hover hover:text-ab-fg focus-visible:outline-2 focus-visible:outline-ab-accent",
        className,
      )}
    />
  );
}

export function TokenBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-[38px] items-center gap-2 rounded-t-xl bg-ab-panel px-3 pb-2 text-[12px] text-ab-fg/90">
      <Info className="size-3 shrink-0 text-ab-faint" />
      <span className="min-w-0 truncate">
        You&rsquo;ve used 80% of your tokens.{" "}
        <button type="button" className="text-ab-accent hover:underline">
          View usage
        </button>
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="ml-auto rounded p-0.5 text-ab-mute hover:bg-ab-hover hover:text-ab-fg"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string, files: string[]) => void;
  placeholder: string;
  withModel?: boolean;
  withMentions?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
  attached?: boolean;
};

export function Composer({ value, onChange, onSubmit, placeholder, withModel, withMentions, textareaRef, autoFocus, attached }: ComposerProps) {
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [modelOpen, setModelOpen] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [mentionOff, setMentionOff] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeModel = useCallback(() => setModelOpen(false), []);
  const modelWrap = useDismiss<HTMLDivElement>(modelOpen, closeModel);
  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const mention = withMentions && !mentionOff ? /(^|\s)@([\w-]*)$/.exec(value) : null;
  const q = mention?.[2].toLowerCase() ?? "";
  const matches = mention
    ? AGENTS.filter((a) => a.name.toLowerCase().replace(/\s+/g, "-").includes(q) || a.name.toLowerCase().includes(q))
    : [];
  const mentionOpen = matches.length > 0;
  const canSend = value.trim().length > 0 || files.length > 0;

  const send = () => {
    if (!canSend) return;
    onSubmit(value.trim(), files);
    setFiles([]);
  };
  const pick = (name: string) => {
    onChange(value.replace(/@[\w-]*$/, `@${name} `));
    setMentionIdx(0);
    textareaRef?.current?.focus();
  };

  return (
    <div className={cn("relative z-10 rounded-xl border border-ab-line2 bg-ab-bg transition-[border-color,box-shadow] focus-within:border-ab-accent focus-within:shadow-[0_0_0_1px_var(--ab-accent)]", attached && "-mt-2.5")}>
      {mentionOpen && (
        <ul
          role="listbox"
          aria-label="Mention an agent"
          className="ab-pop absolute bottom-full left-0 z-30 mb-2 w-72 rounded-xl border border-ab-line2 bg-ab-bg p-1.5 shadow-2xl"
        >
          {matches.map((a, i) => (
            <li key={a.slug} role="option" aria-selected={i === mentionIdx % matches.length}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(a.name)}
                onMouseEnter={() => setMentionIdx(i)}
                className={cn(
                  "flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left",
                  i === mentionIdx % matches.length && "bg-ab-hover",
                )}
              >
                <span className="text-[13px] text-ab-fg">{a.name}</span>
                <span className="truncate text-[11px] text-ab-faint">{a.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
          {files.map((f) => (
            <span key={f} className="inline-flex items-center gap-1 rounded-md border border-ab-line bg-ab-panel px-1.5 py-0.5 text-[11px] text-ab-mute">
              <Paperclip className="size-3" />
              {f}
              <button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles((x) => x.filter((n) => n !== f))}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        autoFocus={autoFocus}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setMentionOff(false);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (mentionOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setMentionIdx((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              pick(matches[mentionIdx % matches.length].name);
              return;
            }
            if (e.key === "Escape") {
              setMentionOff(true);
              return;
            }
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        className="block max-h-40 min-h-6 w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-[13px] leading-6 text-ab-fg outline-none [field-sizing:content] placeholder:text-ab-faint"
      />

      <div className="flex items-center gap-1.5 px-2.5 pt-1 pb-2.5">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            setFiles((x) => [...x, ...names]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          aria-label="Attach files"
          onClick={() => fileRef.current?.click()}
          className="inline-flex size-6 items-center justify-center rounded-md border border-ab-line2 text-ab-mute transition-colors hover:bg-ab-hover hover:text-ab-fg"
        >
          <Paperclip className="size-3" />
        </button>

        {withModel && (
          <div ref={modelWrap} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={modelOpen}
              onClick={() => setModelOpen((o) => !o)}
              className="flex h-6 items-center gap-2 rounded-md px-2 text-[12px] text-ab-fg/90 transition-colors hover:bg-ab-hover"
            >
              <AppGlyph app={model.vendor === "openai" ? "openai" : "fable"} className="size-3.5 text-ab-fg" />
              {model.name}
              <ChevronDown className="size-3 text-ab-mute" />
            </button>
            {modelOpen && (
              <ul
                role="listbox"
                aria-label="Model"
                className="ab-pop absolute bottom-full -left-2 z-30 mb-1.5 w-52 rounded-xl border border-ab-line2 bg-ab-bg p-1.5 shadow-2xl"
              >
                {MODELS.map((m) => (
                  <li key={m.id} role="option" aria-selected={m.id === modelId}>
                    <button
                      type="button"
                      onClick={() => {
                        setModelId(m.id);
                        setModelOpen(false);
                      }}
                      className="flex h-7 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] text-ab-fg/90 hover:bg-ab-hover"
                    >
                      <AppGlyph app={m.vendor === "openai" ? "openai" : "fable"} className="size-3.5 text-ab-fg" />
                      {m.name}
                      {m.id === modelId && <Check className="ml-auto size-3.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          aria-label="Send"
          disabled={!canSend}
          onClick={send}
          className={cn(
            "ml-auto inline-flex size-7 items-center justify-center rounded-md transition-colors",
            canSend ? "bg-ab-fg text-ab-bg hover:opacity-90" : "bg-ab-hover text-ab-faint",
          )}
        >
          <ArrowUp className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
