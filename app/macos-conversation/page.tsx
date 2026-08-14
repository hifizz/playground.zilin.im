"use client";

import { useState, type ChangeEvent } from "react";

type ConversationSection = {
  heading: string;
  body: string | null;
  bullets?: string[];
};

type Conversation = {
  id: number;
  title: string;
  timestamp: string;
  date: string;
  sections: ConversationSection[];
};

const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    title: "Intercom MCP",
    timestamp: "4:01 PM",
    date: "January 9, 2026 at 4:01 PM",
    sections: [
      {
        heading: "Goal",
        body: "Add Intercom as an MCP server alongside PostHog, and Anthropic tools so agents can query and update customer data in real time.",
      },
      {
        heading: "Background",
        body: null,
        bullets: [
          "MCP tools are registered per-server in a shared registry",
          "Each tool is a typed function with input/output schemas",
          "An index.ts acts as the server entrypoint",
          "The connect-to-server handshake negotiates capabilities",
          "Frontend index.tsx surfaces available tools to the agent",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Internal memory viewer",
    timestamp: "11:38 AM",
    date: "January 9, 2026 at 11:38 AM",
    sections: [
      {
        heading: "Goal",
        body: "Build a debug panel that renders the agent's working memory — episodic, semantic, and procedural — in a readable tree view.",
      },
      {
        heading: "Notes",
        body: null,
        bullets: [
          "Memory is keyed by session ID",
          "Episodic memories have timestamps and relevance scores",
          "Semantic memories link to source documents",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Fix onboarding channel list fetching",
    timestamp: "Yesterday",
    date: "January 8, 2026",
    sections: [
      {
        heading: "Problem",
        body: "The onboarding wizard fails to populate the channel list when the user's workspace has more than 500 channels. The paginated API call is not looping correctly.",
      },
    ],
  },
  {
    id: 4,
    title: "Tone improvements",
    timestamp: "Yesterday",
    date: "January 8, 2026",
    sections: [
      {
        heading: "Goal",
        body: "Refine the agent's default tone to be warmer and more concise. Reduce hedging language and passive constructions.",
      },
    ],
  },
  {
    id: 5,
    title: "Account binding fixes",
    timestamp: "Tuesday",
    date: "January 7, 2026",
    sections: [
      {
        heading: "Issue",
        body: "OAuth tokens are not being persisted after account linking. The refresh token is being discarded before storage.",
      },
    ],
  },
];

const sfPro = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
};

const sfProDisplay = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
};

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-black/[0.07] px-3 py-1.5">
      <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
        className="shrink-0 text-gray-400"
        aria-hidden="true"
      >
        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M9.5 9.5L12 12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="text"
        placeholder="Search"
        value={value}
        onChange={handleChange}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400"
        style={sfPro}
      />
    </div>
  );
}

function ConversationItem({
  item,
  isSelected,
  onClick,
}: {
  item: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-100 ${
        isSelected ? "bg-black/[0.07]" : "hover:bg-black/[0.04]"
      }`}
    >
      <p className="truncate text-[14px] leading-snug font-medium text-gray-900" style={sfPro}>
        {item.title}
      </p>
      <p className="mt-0.5 text-[13px] text-gray-400" style={sfPro}>
        {item.timestamp}
      </p>
    </button>
  );
}

function Sidebar({
  items,
  selectedId,
  onSelect,
  searchQuery,
  onSearch,
}: {
  items: Conversation[];
  selectedId: number;
  onSelect: (id: number) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}) {
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-[268px] shrink-0 flex-col pt-3 pb-2">
      <SearchBar value={searchQuery} onChange={onSearch} />
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {filtered.map((item) => (
          <ConversationItem
            key={item.id}
            item={item}
            isSelected={item.id === selectedId}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ContentSection({ section }: { section: ConversationSection }) {
  return (
    <div className="mb-5">
      <h2 className="mb-1.5 text-[15px] font-semibold text-gray-900" style={sfPro}>
        {section.heading}
      </h2>
      {section.body && (
        <p className="text-[14px] leading-relaxed text-gray-700" style={sfPro}>
          {section.body}
        </p>
      )}
      {section.bullets && (
        <ul className="mt-1 space-y-1">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-[6px] h-[4.5px] w-[4.5px] shrink-0 rounded-full bg-gray-500" />
              <span className="text-[14px] leading-relaxed text-gray-700" style={sfPro}>
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContentPanel({ item }: { item: Conversation | null }) {
  const panelStyle = {
    background: "rgba(255,255,255,0.90)",
    backdropFilter: "blur(20px) saturate(160%)",
    WebkitBackdropFilter: "blur(20px) saturate(160%)",
    borderRadius: "16px 0 0 16px",
    borderLeft: "0.5px solid rgba(0,0,0,0.07)",
  };

  if (!item) {
    return (
      <div className="flex flex-1 items-center justify-center" style={panelStyle}>
        <p className="text-[14px] text-gray-400" style={sfPro}>
          Select a conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={panelStyle}>
      <div className="px-7 pt-6 pb-4">
        <h1 className="text-[22px] leading-tight font-bold text-gray-900" style={sfProDisplay}>
          {item.title}
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-400" style={sfPro}>
          {item.date}
        </p>
        <div className="mt-4 border-t border-gray-200/80" />
      </div>

      <div className="flex-1 overflow-y-auto px-7 pb-6">
        {item.sections.map((section) => (
          <ContentSection key={section.heading} section={section} />
        ))}
      </div>
    </div>
  );
}

export default function MacosConversationPage() {
  const [selectedId, setSelectedId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedItem = CONVERSATIONS.find((conversation) => conversation.id === selectedId) ?? null;

  return (
    <div
      className="flex h-screen w-full items-center justify-center p-10"
      style={{
        background: `
          radial-gradient(ellipse at 18% 0%, #b3cde0 0%, transparent 50%),
          radial-gradient(ellipse at 82% 100%, #becfb8 0%, transparent 50%),
          radial-gradient(ellipse at 58% 38%, #cdd8e6 0%, transparent 55%),
          linear-gradient(155deg, #c3d2df 0%, #d5dce7 45%, #cad5c9 100%)
        `,
      }}
    >
      <div
        className="flex overflow-hidden"
        style={{
          width: 860,
          height: 600,
          borderRadius: 20,
          background: "rgba(214,224,232,0.84)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          boxShadow: [
            "0 0 0 0.5px rgba(0,0,0,0.13)",
            "0 22px 64px rgba(0,0,0,0.24)",
            "0 4px 16px rgba(0,0,0,0.10)",
            "inset 0 1px 0 rgba(255,255,255,0.55)",
          ].join(", "),
        }}
      >
        <Sidebar
          items={CONVERSATIONS}
          selectedId={selectedId}
          onSelect={setSelectedId}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
        <ContentPanel item={selectedItem} />
      </div>
    </div>
  );
}
