"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";

const TYPES = ["SYSTEM", "WIN", "GIVEAWAY", "COLLAB"];

export default function AdminBroadcastPage() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; sent?: number; error?: string } | null>(null);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type }),
      });
      const d = await res.json();
      setResult(res.ok ? { ok: true, sent: d.sent } : { error: d.error ?? "Failed" });
      if (res.ok) setMessage("");
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white mb-1">Broadcast</h1>
        <p className="text-[rgb(130,130,150)]">Send a notification to all users on the platform</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-400" />
            Platform Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(180,180,200)] mb-2">Notification Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${type === t ? "border-red-500 bg-red-500/15 text-red-300" : "border-[rgb(40,40,55)] text-[rgb(130,130,150)] hover:border-[rgb(80,80,100)]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(180,180,200)] mb-2">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Write your announcement…"
              className="w-full px-4 py-3 rounded-xl bg-[rgb(10,10,15)] border border-[rgb(40,40,55)] text-white text-sm placeholder:text-[rgb(70,70,90)] focus:outline-none focus:border-red-500 resize-none"
            />
            <div className="text-xs text-right text-[rgb(100,100,120)] mt-1">{message.length}/500</div>
          </div>

          {result && (
            <div className={`flex items-center gap-2 p-4 rounded-xl ${result.ok ? "bg-green-900/20 border border-green-500/30" : "bg-red-900/20 border border-red-500/30"}`}>
              {result.ok ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
              <span className={`text-sm ${result.ok ? "text-green-300" : "text-red-300"}`}>
                {result.ok ? `Sent to ${result.sent?.toLocaleString()} users!` : result.error}
              </span>
            </div>
          )}

          <Button
            variant="gradient"
            className="w-full h-12 gap-2 text-base"
            onClick={send}
            disabled={!message.trim() || sending}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? "Sending…" : "Send to All Users"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
