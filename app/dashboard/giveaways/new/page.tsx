"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, Loader2, ArrowLeft, CheckCircle, Trophy, Users } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  chain: string;
  logoUrl?: string | null;
}

export default function NewGiveawayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    prize: "",
    totalWinners: "1",
    endAt: "",
    requiresXFollow: false,
    xAccountToFollow: "",
    isAgentEligible: true,
  });

  useEffect(() => {
    fetch("/api/communities/mine")
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data.communities ?? []);
        if (data.communities?.length === 1) {
          setSelectedCommunity(data.communities[0]);
        }
      })
      .catch(() => setError("Failed to load communities"))
      .finally(() => setLoadingCommunities(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCommunity) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: selectedCommunity.id,
          title: form.title,
          description: form.description || undefined,
          prize: form.prize,
          totalWinners: Number(form.totalWinners) || 1,
          endAt: form.endAt,
          requiresXFollow: form.requiresXFollow,
          xAccountToFollow: form.requiresXFollow ? form.xAccountToFollow : undefined,
          isAgentEligible: form.isAgentEligible,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create giveaway");
        return;
      }
      router.push(`/c/${selectedCommunity.slug}/manage?tab=giveaways`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Gift className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Create Giveaway</h1>
            </div>

            {loadingCommunities ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : communities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-[rgb(130,130,150)] mx-auto mb-4" />
                  <p className="text-[rgb(200,200,210)] font-medium mb-2">No communities yet</p>
                  <p className="text-[rgb(130,130,150)] text-sm mb-6">
                    You need to create a community before you can run giveaways.
                  </p>
                  <Link href="/dashboard/communities/new">
                    <Button variant="gradient">Create a Community</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Community Selector */}
                {communities.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Community</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3">
                        {communities.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCommunity(c)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                              selectedCommunity?.id === c.id
                                ? "border-purple-500 bg-purple-600/10"
                                : "border-[rgb(40,40,55)] hover:border-[rgb(80,80,100)]"
                            }`}
                          >
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                                {c.name[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{c.name}</p>
                              <p className="text-[rgb(130,130,150)] text-xs">/{c.slug}</p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {c.chain}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Selected community indicator when only one */}
                {communities.length === 1 && selectedCommunity && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-600/5">
                    {selectedCommunity.logoUrl ? (
                      <img src={selectedCommunity.logoUrl} alt={selectedCommunity.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                        {selectedCommunity.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{selectedCommunity.name}</p>
                      <p className="text-[rgb(130,130,150)] text-xs">/{selectedCommunity.slug}</p>
                    </div>
                  </div>
                )}

                {/* Giveaway Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Giveaway Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Title *
                      </label>
                      <Input
                        required
                        placeholder="Epic NFT Giveaway"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Description
                      </label>
                      <Textarea
                        placeholder="Tell participants what this giveaway is about..."
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Prize *
                      </label>
                      <Input
                        required
                        placeholder="1 NFT from Genesis collection"
                        value={form.prize}
                        onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          <Trophy className="w-3.5 h-3.5 inline mr-1.5 text-yellow-400" />
                          Number of Winners *
                        </label>
                        <Input
                          required
                          type="number"
                          min="1"
                          placeholder="1"
                          value={form.totalWinners}
                          onChange={(e) => setForm((f) => ({ ...f, totalWinners: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Ends At *
                        </label>
                        <Input
                          required
                          type="datetime-local"
                          value={form.endAt}
                          onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.requiresXFollow}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, requiresXFollow: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.requiresXFollow ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.requiresXFollow ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm">Require X Follow</p>
                        <p className="text-[rgb(130,130,150)] text-xs">
                          Participants must follow an X account to enter
                        </p>
                      </div>
                    </label>

                    {form.requiresXFollow && (
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          X Account to Follow *
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[rgb(130,130,150)]">@</span>
                          <Input
                            required={form.requiresXFollow}
                            placeholder="yourproject"
                            value={form.xAccountToFollow}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                xAccountToFollow: e.target.value.replace("@", ""),
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.isAgentEligible}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, isAgentEligible: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.isAgentEligible ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.isAgentEligible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm">Agent Eligible</p>
                        <p className="text-[rgb(130,130,150)] text-xs">
                          Allow OpenClaw agents to automatically enter this giveaway
                        </p>
                      </div>
                    </label>
                  </CardContent>
                </Card>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Link href="/dashboard">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={loading || !selectedCommunity}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Create Giveaway
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
