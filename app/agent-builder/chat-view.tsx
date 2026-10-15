"use client";

import { useEffect, useRef, useState } from "react";
import { History, Plus, FileText, FileSearch, RefreshCw } from "lucide-react";
import { AGENTS, RECOMMENDED, type AppId } from "./data";
import { AppChip, Mascot } from "./icons";
import { Composer, IconButton, TokenBanner } from "./parts";

type Msg = { role: "user" | "assistant"; text: string; files?: string[] };

function replyFor(text: string) {
  const agent = AGENTS.find((a) => text.toLowerCase().includes(`@${a.name.toLowerCase()}`));
  if (agent) return `Handing this over to ${agent.name}. ${agent.tagline}. I’ll post the result here when it’s done.`;
  return "On it. I’ll pick the best-fit agent for this, pull the relevant sources and report back here in a moment.";
}

function Apps({ apps }: { apps: AppId[] }) {
  return (
    <span className="mx-1 inline-flex -space-x-1 align-middle">
      {apps.map((a) => (
        <AppChip key={a} app={a} size={16} className="rounded-[5px]" />
      ))}
    </span>
  );
}

const ICONS = { doc: FileText, search: FileSearch, repeat: RefreshCw };

export function ChatView() {
  const [value, setValue] = useState("");
  const [bannerOpen, setBannerOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs, typing]);

  const submit = (text: string, files: string[]) => {
    setMsgs((m) => [...m, { role: "user", text, files }]);
    setValue("");
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "assistant", text: replyFor(text) }]);
    }, 1400);
  };
  const reset = () => {
    clearTimeout(timer.current);
    setMsgs([]);
    setTyping(false);
    setValue("");
  };
  const started = msgs.length > 0;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-[38px] shrink-0 items-center justify-between border-b border-ab-line px-3.5 pt-0.5 text-[12.5px] text-ab-fg">
        <span className="flex items-center gap-2">Chat</span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={reset}
            className="flex h-6 items-center gap-1 rounded-md px-2 text-[12px] text-ab-mute hover:bg-ab-hover hover:text-ab-fg"
          >
            <Plus className="size-3" /> New chat
          </button>
          <IconButton aria-label="History" className="size-6">
            <History className="size-3.5" />
          </IconButton>
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[630px] flex-1 flex-col px-5 py-8" style={{ justifyContent: started ? "flex-start" : "center" }}>
          {started ? (
            <div className="flex flex-col gap-4 pb-6" aria-live="polite">
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ab-pop self-end rounded-2xl rounded-br-md bg-ab-sel px-3.5 py-2 text-[13px] leading-5 text-ab-fg">
                    {m.text}
                    {m.files?.map((f) => (
                      <div key={f} className="mt-1 text-[11px] text-ab-mute">📎 {f}</div>
                    ))}
                  </div>
                ) : (
                  <div key={i} className="ab-pop flex gap-2.5">
                    <Mascot size={24} />
                    <p className="pt-0.5 text-[13px] leading-5 text-ab-fg/90">{m.text}</p>
                  </div>
                ),
              )}
              {typing && (
                <div className="flex items-center gap-2.5 text-[12px] text-ab-mute">
                  <Mascot size={24} /> Thinking…
                </div>
              )}
              <div ref={end} />
            </div>
          ) : (
            <div className="mb-3.5 -mt-12">
              <Mascot size={66} />
              <h1 className="mt-3.5 text-[16px] font-medium text-ab-fg">Who&rsquo;s on it today?</h1>
            </div>
          )}

          <div className={started ? "sticky bottom-0 mt-auto bg-ab-bg pb-1" : ""}>
            {bannerOpen && <TokenBanner onClose={() => setBannerOpen(false)} />}
            <Composer
              value={value}
              onChange={setValue}
              onSubmit={submit}
              placeholder="Ask anything, or type @ to mention an agent"
              withModel
              withMentions
              attached={bannerOpen}
              textareaRef={ta}
              autoFocus
            />
          </div>

          {!started && (
            <div className="mt-5">
              <div className="mb-2 text-[11.5px] text-ab-faint">Recommended for you</div>
              <ul className="flex flex-col">
                {RECOMMENDED.map((r) => {
                  const Icon = ICONS[r.icon];
                  return (
                    <li key={r.fill}>
                      <button
                        type="button"
                        onClick={() => {
                          setValue(r.fill);
                          ta.current?.focus();
                        }}
                        className="flex h-[23px] items-center gap-2 text-left text-[12px] text-ab-fg/90 hover:text-ab-fg"
                      >
                        <Icon className="size-3.5 text-ab-mute" />
                        <span className="flex items-center whitespace-pre">
                          {r.before}
                          {r.apps && <Apps apps={r.apps} />}
                          {r.middle}
                          {r.apps2 && <Apps apps={r.apps2} />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
