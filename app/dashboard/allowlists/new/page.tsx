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
import { ListChecks, Loader2, ArrowLeft, CheckCircle, Users, Zap, Shuffle, Handshake } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  chain: string;
  logoUrl?: string | null;
}

const ENTRY_METHODS = [
  {
    value: "FCFS",
    label: "First Come, First Served",
    description: "Spots are filled in order of sign-up",
    icon: Zap,
    color: "text-green-400",
  },
  {
    value: "RAFFLE",
    label: "Raffle",
    description: "Winners are randomly selected at close",
    icon: Shuffle,
    color: "text-blue-400",
  },
  {
    value: "COLLAB",
    label: "Collab",
    description: "Spots reserved for partner communities",
    icon: Handshake,
    color: "text-orange-400",
  },
];

export default function NewAllowlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    totalSpots: "",
    entryMethod: "FCFS",
    closesAt: "",
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
      const res = await fetch("/api/allowlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: selectedCommunity.id,
          name: form.name,
          description: form.description || undefined,
          totalSpots: Number(form.totalSpots),
          entryMethod: form.entryMethod,
          closesAt: form.closesAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create allowlist");
        return;
      }
      router.push(`/c/${selectedCommunity.slug}/manage?tab=allowlists`);
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
              <ListChecks className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Create Allowlist</h1>
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
                    You need to create a community before you can run allowlists.
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

                {/* Allowlist Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Allowlist Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Name *
                      </label>
                      <Input
                        required
                        placeholder="Genesis Mint Allowlist"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Description
                      </label>
                      <Textarea
                        placeholder="Describe what this allowlist is for..."
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Total Spots *
                        </label>
                        <Input
                          required
                          type="number"
                          min="1"
                          placeholder="500"
                          value={form.totalSpots}
                          onChange={(e) => setForm((f) => ({ ...f, totalSpots: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Closes At
                        </label>
                        <Input
                          type="datetime-local"
                          value={form.closesAt}
                          onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Entry Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {ENTRY_METHODS.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, entryMethod: method.value }))}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                              form.entryMethod === method.value
                                ? "border-purple-500 bg-purple-600/10"
                                : "border-[rgb(40,40,55)] hover:border-[rgb(80,80,100)]"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${method.color} shrink-0`} />
                            <div>
                              <p className="text-white font-medium text-sm">{method.label}</p>
                              <p className="text-[rgb(130,130,150)] text-xs mt-0.5">
                                {method.description}
                              </p>
                            </div>
                            {form.entryMethod === method.value && (
                              <CheckCircle className="w-4 h-4 text-purple-400 ml-auto shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                        Create Allowlist
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
