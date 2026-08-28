"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "@/components/locale-provider";
import { HelpMarkdown } from "@/components/help/help-markdown";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 50;
const CHAT_EVENT = "psylex-help-chat";

function storageKey(userId: string | undefined) {
  return `psylex-help-chat:${userId ?? "guest"}`;
}

function parseHistory(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string",
    );
  } catch {
    return [];
  }
}

function subscribeHelpChat(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHAT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHAT_EVENT, onStoreChange);
  };
}

function writeHistory(key: string, messages: ChatMessage[]) {
  window.localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  window.dispatchEvent(new Event(CHAT_EVENT));
}

export function HelpChatWidget() {
  const { locale, portal } = useLocale();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const key = useMemo(() => storageKey(userId), [userId]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const getSnapshot = useCallback(() => window.localStorage.getItem(key), [key]);
  const raw = useSyncExternalStore(subscribeHelpChat, getSnapshot, () => null);
  const messages = useMemo(() => parseHistory(raw), [raw]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, messages, pending]);

  const send = async () => {
    const content = draft.trim();
    if (!content || pending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    writeHistory(key, nextMessages);
    setDraft("");
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })),
        }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || portal.helpChatError);
      }
      writeHistory(key, [
        ...nextMessages,
        { id: crypto.randomUUID(), role: "assistant", content: payload.reply },
      ]);
    } catch {
      setError(portal.helpChatError);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <section className="pointer-events-auto flex h-[min(32rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-hair bg-surface-container shadow-modal">
          <header className="flex items-center justify-between gap-2 border-b border-hair px-4 py-3">
            <div>
              <p className="font-display text-headline-md text-ink">{portal.helpChatTitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded-full p-1.5 text-ink-soft hover:text-ink"
                onClick={() => writeHistory(key, [])}
                title={portal.helpChatClear}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
              <button
                aria-label={portal.helpChatClose}
                className="rounded-full p-1.5 text-ink-soft hover:text-ink"
                onClick={() => setOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </header>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3" ref={listRef}>
            {messages.length === 0 && !pending ? (
              <p className="text-body-sm text-ink-soft">{portal.helpChatEmpty}</p>
            ) : null}
            {messages.map((message) => (
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-body-sm",
                  message.role === "user"
                    ? "ml-auto bg-ink text-white"
                    : "mr-auto border border-hair bg-paper text-ink",
                )}
                key={message.id}
              >
                {message.role === "assistant" ? (
                  <HelpMarkdown compact markdown={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            ))}
            {pending ? (
              <div className="mr-auto flex items-center gap-2 rounded-2xl border border-hair bg-paper px-3 py-2 text-body-sm text-ink-soft">
                <Spinner size="sm" />
                {portal.helpChatThinking}
              </div>
            ) : null}
            {error ? <p className="text-body-sm text-red-700">{error}</p> : null}
          </div>

          <form
            className="border-t border-hair p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-full border border-hair bg-paper px-4 py-2 text-body-sm text-ink focus:border-law focus:outline-none"
                onChange={(event) => setDraft(event.target.value)}
                placeholder={portal.helpChatPlaceholder}
                value={draft}
              />
              <button
                className="btn-primary grid h-10 w-10 place-items-center disabled:opacity-50"
                disabled={pending || !draft.trim()}
                type="submit"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                <span className="sr-only">{portal.helpChatSend}</span>
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        aria-label={open ? portal.helpChatClose : portal.helpChatOpen}
        className="pointer-events-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-lg transition hover:bg-[#0f1a2e]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="material-symbols-outlined text-[26px]">{open ? "close" : "chat"}</span>
      </button>
    </div>
  );
}
