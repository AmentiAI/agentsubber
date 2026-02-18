"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send } from "lucide-react";
import Link from "next/link";

// Plan badge colors
function PlanBadge({ plan }: { plan?: string }) {
  if (!plan || plan === "FREE") return null;
  if (plan === "ELITE") return <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">👑 ELITE</span>;
  return <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">⚡ PRO</span>;
}

function ChatMessageItem({ msg }: { msg: any }) {
  const user = msg.user;
  const community = user?.ownedCommunities?.[0];
  const initials = (user?.name ?? user?.xHandle ?? "?")[0].toUpperCase();

  return (
    <div className="flex gap-2.5 py-2">
      {/* Avatar */}
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
        <p className="text-sm text-[rgb(200,200,210)] break-words">{msg.content}</p>
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat").then(r => r.json()).then(d => setMessages(d.messages ?? []));
  }, []);

  useEffect(() => {
    let pusher: ReturnType<typeof getPusherClient> | null = null;
    try {
      pusher = getPusherClient();
      const channel = pusher.subscribe("global-chat");
      channel.bind("message", (msg: any) => {
        setMessages(prev => [...prev, msg]);
        if (!open) setUnread(u => u + 1);
      });
    } catch {}
    return () => {
      try { pusher?.unsubscribe("global-chat"); } catch {}
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 h-[500px] bg-[rgb(16,16,22)] border border-[rgb(40,40,55)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(40,40,55)] bg-[rgb(20,20,28)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold text-white">Live Chat</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[rgb(130,130,150)] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 divide-y divide-[rgb(30,30,40)]">
            {messages.length === 0 && (
              <div className="text-center text-[rgb(130,130,150)] text-sm py-8">No messages yet. Say hi! 👋</div>
            )}
            {messages.map((m, i) => <ChatMessageItem key={m.id ?? i} msg={m} />)}
            <div ref={bottomRef} />
          </div>
          {/* Input */}
          <div className="px-4 py-3 border-t border-[rgb(40,40,55)] bg-[rgb(20,20,28)]">
            {session ? (
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Say something..."
                  maxLength={500}
                  className="flex-1 bg-[rgb(30,30,40)] border border-[rgb(50,50,65)] rounded-lg px-3 py-2 text-sm text-white placeholder-[rgb(90,90,110)] focus:outline-none focus:border-purple-500"
                />
                <Button size="sm" variant="gradient" onClick={send} disabled={sending || !input.trim()}>
                  <Send className="w-4 h-4" />
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
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform relative"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
