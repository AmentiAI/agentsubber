"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import Link from "next/link";

function PlanBadge({ plan }: { plan?: string }) {
  if (!plan || plan === "FREE") return null;
  if (plan === "ELITE") return <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">👑</span>;
  return <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">⚡</span>;
}

function ChatMessageItem({ msg }: { msg: any }) {
  const user = msg.user;
  const community = user?.ownedCommunities?.[0];
  const initials = (user?.name ?? user?.xHandle ?? "?")[0].toUpperCase();
  return (
    <div className="flex gap-2.5 py-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
        {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-white">
            {user?.xHandle ? `@${user.xHandle}` : (user?.name ?? "Anonymous")}
          </span>
          <PlanBadge plan={user?.subscription?.plan} />
          {community && (
            <Link href={`/c/${community.slug}`} className="text-xs text-purple-400 hover:text-purple-300 truncate max-w-[80px]">
              · {community.name}
            </Link>
          )}
        </div>
        <p className="text-sm text-[rgb(200,200,215)] break-words leading-snug">{msg.content}</p>
      </div>
    </div>
  );
}

export default function GlobalChat() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [online] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = await res.json();
      const msgs: any[] = data.messages ?? [];
      if (msgs.length === 0) return;
      const lastNew = msgs[msgs.length - 1]?.id;
      if (lastNew !== lastIdRef.current) {
        const newCount = lastIdRef.current
          ? msgs.filter((m: any) => m.id > lastIdRef.current!).length
          : 0;
        lastIdRef.current = lastNew;
        setMessages(msgs);
        if (!open && newCount > 0) setUnread((u) => u + newCount);
      }
    } catch { /* network error — silently skip */ }
  }, [open]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, []);

  // Poll every 4s
  useEffect(() => {
    pollRef.current = setInterval(() => fetchMessages(true), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // Scroll to bottom when opened or new messages arrive
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      // Immediate fetch after sending
      await fetchMessages();
    } catch {
      setInput(text); // restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-96 h-[480px] sm:h-[520px] bg-[rgb(13,13,20)] border border-[rgb(40,40,55)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(35,35,50)] bg-[rgb(18,18,26)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold text-white">Live Chat</span>
              <span className="text-xs text-[rgb(120,120,140)]">Communiclaw</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(30,30,40)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 divide-y divide-[rgb(25,25,38)]">
            {messages.length === 0 ? (
              <div className="text-center text-[rgb(120,120,140)] text-sm py-12">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                No messages yet. Say hi! 👋
              </div>
            ) : messages.map((m, i) => <ChatMessageItem key={m.id ?? i} msg={m} />)}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[rgb(35,35,50)] bg-[rgb(18,18,26)]">
            {session ? (
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Message everyone…"
                  maxLength={500}
                  disabled={sending}
                  className="flex-1 bg-[rgb(25,25,35)] border border-[rgb(45,45,60)] rounded-xl px-3 py-2 text-sm text-white placeholder-[rgb(90,90,110)] focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                />
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="gradient" className="w-full text-sm">Sign in to chat</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform relative"
        aria-label="Toggle live chat"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
