"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Plus,
  Trash2,
  Loader2,
  Bell,
  Crown,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface TrackerAlert {
  id: string;
  watchedAddress: string;
  chain: string;
  alertTypes: string[];
  isActive: boolean;
  webhookUrl: string | null;
  createdAt: string;
}

export default function TrackerPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<TrackerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    watchedAddress: "",
    chain: "SOL",
    webhookUrl: "",
  });

  const user = session?.user as any;
  const plan = user?.plan ?? "FREE";
  const hasAccess = plan === "ELITE";

  useEffect(() => {
    fetch("/api/tracker")
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function addAlert(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setAlerts((prev) => [data.alert, ...prev]);
        setShowForm(false);
        setForm({ watchedAddress: "", chain: "SOL", webhookUrl: "" });
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteAlert(id: string) {
    const res = await fetch("/api/tracker", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id }),
    });
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">Wallet Tracker</h1>
              </div>
              {hasAccess && (
                <Button
                  variant="gradient"
                  className="gap-2"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus className="w-4 h-4" />
                  Track Wallet
                </Button>
              )}
            </div>

            {!hasAccess ? (
              <Card className="border-yellow-500/30 bg-yellow-500/10">
                <CardContent className="p-8 text-center">
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Elite Feature
                  </h3>
                  <p className="text-[rgb(130,130,150)] mb-4">
                    Wallet Tracker is available on the Elite plan. Monitor any SOL or BTC
                    wallet in real-time with instant transaction alerts.
                  </p>
                  <Link href="/dashboard/subscription">
                    <Button variant="gradient" className="gap-2">
                      <Crown className="w-4 h-4" />
                      Upgrade to Elite
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {showForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Track a Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={addAlert} className="space-y-4">
                        <div>
                          <label className="block text-sm text-[rgb(200,200,210)] mb-1.5">
                            Wallet Address
                          </label>
                          <Input
                            required
                            placeholder="Solana or Bitcoin address..."
                            value={form.watchedAddress}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, watchedAddress: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[rgb(200,200,210)] mb-1.5">
                            Chain
                          </label>
                          <div className="flex gap-2">
                            {["SOL", "BTC"].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, chain: c }))}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                  form.chain === c
                                    ? "border-purple-500 bg-purple-600/10 text-purple-300"
                                    : "border-[rgb(40,40,55)] text-[rgb(200,200,210)] hover:border-[rgb(80,80,100)]"
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-[rgb(200,200,210)] mb-1.5">
                            Webhook URL (optional)
                          </label>
                          <Input
                            placeholder="https://discord.com/api/webhooks/..."
                            value={form.webhookUrl}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, webhookUrl: e.target.value }))
                            }
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="gradient" disabled={adding}>
                            {adding ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Start Tracking"
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {loading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-16">
                    <Eye className="w-12 h-12 text-[rgb(130,130,150)] mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-2">No wallets tracked</h3>
                    <p className="text-[rgb(130,130,150)] text-sm">
                      Add a wallet address to start monitoring transactions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[rgb(30,30,40)] flex items-center justify-center">
                              <Eye className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-mono text-sm text-white">
                                {truncateAddress(alert.watchedAddress, 8)}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant={alert.chain === "SOL" ? "sol" : "btc"}
                                  className="text-xs py-0"
                                >
                                  {alert.chain}
                                </Badge>
                                {alert.webhookUrl && (
                                  <div className="flex items-center gap-1 text-xs text-[rgb(130,130,150)]">
                                    <Bell className="w-3 h-3" />
                                    Webhook
                                  </div>
                                )}
                                <Badge
                                  variant={alert.isActive ? "success" : "secondary"}
                                  className="text-xs py-0"
                                >
                                  {alert.isActive ? "Active" : "Paused"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlert(alert.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
