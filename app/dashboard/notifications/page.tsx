"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trophy, Handshake, Gift, Info, Loader2, CheckCheck } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

function NotifIcon({ type }: { type: string }) {
  const cls = "w-5 h-5";
  if (type === "WIN") return <Trophy className={`${cls} text-yellow-400`} />;
  if (type === "COLLAB") return <Handshake className={`${cls} text-purple-400`} />;
  if (type === "GIVEAWAY") return <Gift className={`${cls} text-pink-400`} />;
  return <Info className={`${cls} text-indigo-400`} />;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarking(false);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge variant="live">{unreadCount} new</Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-[rgb(130,130,150)]"
                  onClick={markAllRead}
                  disabled={marking}
                >
                  {marking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  Mark all read
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20">
                <Bell className="w-12 h-12 text-[rgb(130,130,150)] mx-auto mb-4 opacity-40" />
                <h3 className="text-white font-semibold mb-2">All caught up!</h3>
                <p className="text-[rgb(130,130,150)] text-sm">
                  You have no notifications yet. Enter some giveaways to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      n.read
                        ? "bg-[rgb(16,16,22)] border-[rgb(40,40,55)]"
                        : "bg-purple-900/10 border-purple-500/30 hover:bg-purple-900/20"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.read ? "bg-[rgb(30,30,40)]" : "bg-purple-600/20"
                    }`}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-semibold ${n.read ? "text-[rgb(180,180,200)]" : "text-white"}`}>
                            {n.title}
                          </p>
                          <p className="text-sm text-[rgb(130,130,150)] mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[rgb(100,100,120)]">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                        {n.link && (
                          <Link
                            href={n.link}
                            className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
