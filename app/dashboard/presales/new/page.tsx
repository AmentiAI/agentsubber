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
import { ShoppingBag, Loader2, ArrowLeft, CheckCircle, Users, DollarSign, Calendar } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  chain: string;
  logoUrl?: string | null;
}

export default function NewPresalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    priceSOL: "",
    priceBTC: "",
    totalSupply: "",
    maxPerWallet: "1",
    startsAt: "",
    endsAt: "",
    allowlistRequired: false,
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
      const res = await fetch("/api/presales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: selectedCommunity.id,
          name: form.name,
          description: form.description || undefined,
          priceSOL: form.priceSOL ? parseFloat(form.priceSOL) : undefined,
          priceBTC: form.priceBTC ? parseFloat(form.priceBTC) : undefined,
          totalSupply: Number(form.totalSupply),
          maxPerWallet: Number(form.maxPerWallet) || 1,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
          allowlistRequired: form.allowlistRequired,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create presale");
        return;
      }
      router.push(`/c/${selectedCommunity.slug}/manage?tab=presales`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <ShoppingBag className="w-6 h-6 text-green-400" />
              <h1 className="text-2xl font-bold text-white">Create Presale</h1>
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
                    You need to create a community before you can launch presales.
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

                {/* Presale Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Presale Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Name *
                      </label>
                      <Input
                        required
                        placeholder="Genesis Collection Presale"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Description
                      </label>
                      <Textarea
                        placeholder="Tell buyers what they're getting..."
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Total Supply *
                        </label>
                        <Input
                          required
                          type="number"
                          min="1"
                          placeholder="1000"
                          value={form.totalSupply}
                          onChange={(e) => setForm((f) => ({ ...f, totalSupply: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Max Per Wallet
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={form.maxPerWallet}
                          onChange={(e) => setForm((f) => ({ ...f, maxPerWallet: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[rgb(130,130,150)]">
                      Set at least one price. Leave blank if not accepting that currency.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Price in SOL
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.5"
                            value={form.priceSOL}
                            onChange={(e) => setForm((f) => ({ ...f, priceSOL: e.target.value }))}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[rgb(130,130,150)]">
                            ◎
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Price in BTC
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.00001"
                            min="0"
                            placeholder="0.001"
                            value={form.priceBTC}
                            onChange={(e) => setForm((f) => ({ ...f, priceBTC: e.target.value }))}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[rgb(130,130,150)]">
                            ₿
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Starts At *
                        </label>
                        <Input
                          required
                          type="datetime-local"
                          value={form.startsAt}
                          onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Ends At *
                        </label>
                        <Input
                          required
                          type="datetime-local"
                          value={form.endsAt}
                          onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Access Control */}
                <Card>
                  <CardHeader>
                    <CardTitle>Access Control</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.allowlistRequired}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, allowlistRequired: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.allowlistRequired ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.allowlistRequired ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Allowlist</p>
                        <p className="text-[rgb(130,130,150)] text-xs">
                          Only wallets on an allowlist can participate in this presale
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
                        Create Presale
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
