"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/chat");
    const d = await res.json();
    setMessages(d.messages ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteMsg = async (id: string) => {
    setDeleting(id);
    await fetch("/api/admin/chat", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id }) });
    setMessages(prev => prev.filter(m => m.id !== id));
    setDeleting(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-1">Live Chat</h1>
          <p className="text-[rgb(130,130,150)]">Moderate global chat messages</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" />Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : messages.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-[rgb(100,100,120)]">No chat messages</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[rgb(25,25,38)] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {m.user?.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{m.user?.xHandle ? `@${m.user.xHandle}` : m.user?.name ?? "Unknown"}</span>
                    <span className="text-xs text-[rgb(100,100,120)]">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-[rgb(200,200,210)] break-words">{m.content ?? m.message}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 shrink-0" disabled={deleting === m.id} onClick={() => deleteMsg(m.id)}>
                  {deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
