"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/utils";

const CHAINS = [
  { value: "SOL", label: "◎ Solana", color: "text-purple-400" },
  { value: "BTC", label: "₿ Bitcoin Ordinals", color: "text-orange-400" },
];

export default function NewCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    chain: "SOL",
    twitterHandle: "",
    discordInvite: "",
    telegramLink: "",
    websiteUrl: "",
  });

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create community");
        return;
      }
      router.push(`/c/${data.community.slug}`);
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
              <Link href="/dashboard/communities">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Users className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Create Community</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      Community Name *
                    </label>
                    <Input
                      required
                      placeholder="My NFT Project"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[rgb(130,130,150)]">communiclaw.xyz/c/</span>
                      <Input
                        required
                        placeholder="my-nft-project"
                        value={form.slug}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      Description
                    </label>
                    <Textarea
                      placeholder="Tell your community what you're about..."
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-2">
                      Primary Chain *
                    </label>
                    <div className="flex gap-3">
                      {CHAINS.map((chain) => (
                        <button
                          key={chain.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, chain: chain.value }))}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                            form.chain === chain.value
                              ? "border-purple-500 bg-purple-600/10"
                              : "border-[rgb(40,40,55)] hover:border-[rgb(80,80,100)]"
                          }`}
                        >
                          <span className={chain.color}>{chain.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      X (Twitter) Handle
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[rgb(130,130,150)]">@</span>
                      <Input
                        placeholder="yourproject"
                        value={form.twitterHandle}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, twitterHandle: e.target.value.replace("@", "") }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      Discord Invite URL
                    </label>
                    <Input
                      placeholder="https://discord.gg/..."
                      value={form.discordInvite}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, discordInvite: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      Telegram Link
                    </label>
                    <Input
                      placeholder="https://t.me/..."
                      value={form.telegramLink}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, telegramLink: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                      Website
                    </label>
                    <Input
                      placeholder="https://yourproject.io"
                      value={form.websiteUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, websiteUrl: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/dashboard/communities">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="gradient" disabled={loading} className="flex-1">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Community
                    </>
                  )}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
