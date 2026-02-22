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
import { 
  Gift, Loader2, ArrowLeft, CheckCircle, Trophy, Users, 
  Twitter, MessageCircle, Hash, Send, Eye, EyeOff, Shield 
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  chain: string;
  logoUrl?: string | null;
}

interface RoleMultiplier {
  roleId: string;
  roleName: string;
  multiplier: number;
}

export default function NewGiveawayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [roleMultipliers, setRoleMultipliers] = useState<RoleMultiplier[]>([]);

  const [form, setForm] = useState({
    // Basic info
    title: "",
    description: "",
    prize: "",
    totalWinners: "1",
    chain: "SOL",
    status: "DRAFT" as "DRAFT" | "ACTIVE",
    
    // Timing
    startAt: "",
    endAt: "",
    
    // Twitter/X Requirements
    requiresXFollow: false,
    xAccountToFollow: "",
    requiresXRetweet: false,
    xTweetToRetweet: "",
    requiresXLike: false,
    xTweetToLike: "",
    requiresXTag: false,
    xTagsRequired: "",
    
    // Discord Requirements
    requiresDiscord: false,
    discordGuildId: "",
    requiredDiscordRole: "",
    
    // Telegram Requirements
    requiresTelegram: false,
    telegramGroup: "",
    
    // Privacy & Team
    isPrivate: false,
    hideEntryCount: false,
    teamSpots: "",
    
    // Agent
    isAgentEligible: true,
  });

  useEffect(() => {
    fetch("/api/communities/mine")
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data.communities ?? []);
        if (data.communities?.length === 1) {
          setSelectedCommunity(data.communities[0]);
          setForm(f => ({ ...f, chain: data.communities[0].chain }));
        }
      })
      .catch(() => setError("Failed to load communities"))
      .finally(() => setLoadingCommunities(false));
  }, []);

  function addRoleMultiplier() {
    setRoleMultipliers([...roleMultipliers, { roleId: "", roleName: "", multiplier: 1 }]);
  }

  function updateRoleMultiplier(index: number, field: keyof RoleMultiplier, value: string | number) {
    const updated = [...roleMultipliers];
    updated[index] = { ...updated[index], [field]: value };
    setRoleMultipliers(updated);
  }

  function removeRoleMultiplier(index: number) {
    setRoleMultipliers(roleMultipliers.filter((_, i) => i !== index));
  }

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
          chain: form.chain,
          status: form.status,
          startAt: form.startAt,
          endAt: form.endAt,
          
          // Twitter
          requiresXFollow: form.requiresXFollow,
          xAccountToFollow: form.requiresXFollow ? form.xAccountToFollow : undefined,
          requiresXRetweet: form.requiresXRetweet,
          xTweetToRetweet: form.requiresXRetweet ? form.xTweetToRetweet : undefined,
          requiresXLike: form.requiresXLike,
          xTweetToLike: form.requiresXLike ? form.xTweetToLike : undefined,
          requiresXTag: form.requiresXTag,
          xTagsRequired: form.requiresXTag ? form.xTagsRequired : undefined,
          
          // Discord
          requiresDiscord: form.requiresDiscord,
          discordGuildId: form.requiresDiscord ? form.discordGuildId : undefined,
          requiredDiscordRole: form.requiredDiscordRole || undefined,
          
          // Telegram
          requiresTelegram: form.requiresTelegram,
          telegramGroup: form.requiresTelegram ? form.telegramGroup : undefined,
          
          // Privacy
          isPrivate: form.isPrivate,
          hideEntryCount: form.hideEntryCount,
          teamSpots: form.teamSpots ? Number(form.teamSpots) : undefined,
          
          // Agent
          isAgentEligible: form.isAgentEligible,
          
          // Role multipliers
          roleMultipliers: roleMultipliers.filter(r => r.roleId && r.roleName),
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
                            onClick={() => {
                              setSelectedCommunity(c);
                              setForm(f => ({ ...f, chain: c.chain }));
                            }}
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

                {/* Selected community indicator */}
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

                {/* Basic Details */}
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
                          Chain *
                        </label>
                        <select
                          required
                          className="w-full rounded-lg bg-[rgb(25,25,35)] border border-[rgb(40,40,55)] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          value={form.chain}
                          onChange={(e) => setForm((f) => ({ ...f, chain: e.target.value }))}
                        >
                          <option value="SOL">Solana</option>
                          <option value="BTC">Bitcoin</option>
                          <option value="ETH">Ethereum</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Start Time *
                        </label>
                        <Input
                          required
                          type="datetime-local"
                          value={form.startAt}
                          onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          End Time *
                        </label>
                        <Input
                          required
                          type="datetime-local"
                          value={form.endAt}
                          onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Status *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, status: "DRAFT" }))}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            form.status === "DRAFT"
                              ? "border-purple-500 bg-purple-600/10"
                              : "border-[rgb(40,40,55)] hover:border-[rgb(80,80,100)]"
                          }`}
                        >
                          <p className="text-white font-medium text-sm">Draft</p>
                          <p className="text-[rgb(130,130,150)] text-xs">Save without publishing</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, status: "ACTIVE" }))}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            form.status === "ACTIVE"
                              ? "border-purple-500 bg-purple-600/10"
                              : "border-[rgb(40,40,55)] hover:border-[rgb(80,80,100)]"
                          }`}
                        >
                          <p className="text-white font-medium text-sm">Publish Now</p>
                          <p className="text-[rgb(130,130,150)] text-xs">Make live immediately</p>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Twitter Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Twitter className="w-5 h-5 text-blue-400" />
                      Twitter/X Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Follow */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer group mb-3">
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
                          <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Follow</p>
                          <p className="text-[rgb(130,130,150)] text-xs">Must follow X account</p>
                        </div>
                      </label>

                      {form.requiresXFollow && (
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
                      )}
                    </div>

                    {/* Retweet */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer group mb-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={form.requiresXRetweet}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, requiresXRetweet: e.target.checked }))
                            }
                          />
                          <div
                            className={`w-10 h-6 rounded-full transition-colors ${
                              form.requiresXRetweet ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                            }`}
                          />
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              form.requiresXRetweet ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Retweet</p>
                          <p className="text-[rgb(130,130,150)] text-xs">Must retweet specific tweet</p>
                        </div>
                      </label>

                      {form.requiresXRetweet && (
                        <Input
                          required={form.requiresXRetweet}
                          placeholder="https://twitter.com/username/status/123456789..."
                          value={form.xTweetToRetweet}
                          onChange={(e) => setForm((f) => ({ ...f, xTweetToRetweet: e.target.value }))}
                        />
                      )}
                    </div>

                    {/* Like */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer group mb-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={form.requiresXLike}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, requiresXLike: e.target.checked }))
                            }
                          />
                          <div
                            className={`w-10 h-6 rounded-full transition-colors ${
                              form.requiresXLike ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                            }`}
                          />
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              form.requiresXLike ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Like</p>
                          <p className="text-[rgb(130,130,150)] text-xs">Must like specific tweet</p>
                        </div>
                      </label>

                      {form.requiresXLike && (
                        <Input
                          required={form.requiresXLike}
                          placeholder="https://twitter.com/username/status/123456789..."
                          value={form.xTweetToLike}
                          onChange={(e) => setForm((f) => ({ ...f, xTweetToLike: e.target.value }))}
                        />
                      )}
                    </div>

                    {/* Tag friends */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer group mb-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={form.requiresXTag}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, requiresXTag: e.target.checked }))
                            }
                          />
                          <div
                            className={`w-10 h-6 rounded-full transition-colors ${
                              form.requiresXTag ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                            }`}
                          />
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              form.requiresXTag ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Tag Friends</p>
                          <p className="text-[rgb(130,130,150)] text-xs">Must tag users in comments</p>
                        </div>
                      </label>

                      {form.requiresXTag && (
                        <Input
                          required={form.requiresXTag}
                          type="number"
                          min="1"
                          placeholder="3"
                          value={form.xTagsRequired}
                          onChange={(e) => setForm((f) => ({ ...f, xTagsRequired: e.target.value }))}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Discord Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-indigo-400" />
                      Discord Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.requiresDiscord}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, requiresDiscord: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.requiresDiscord ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.requiresDiscord ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Discord Join</p>
                        <p className="text-[rgb(130,130,150)] text-xs">Must join Discord server</p>
                      </div>
                    </label>

                    {form.requiresDiscord && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                            Discord Server ID *
                          </label>
                          <Input
                            required={form.requiresDiscord}
                            placeholder="123456789012345678"
                            value={form.discordGuildId}
                            onChange={(e) => setForm((f) => ({ ...f, discordGuildId: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                            Required Role ID (optional)
                          </label>
                          <Input
                            placeholder="987654321098765432"
                            value={form.requiredDiscordRole}
                            onChange={(e) => setForm((f) => ({ ...f, requiredDiscordRole: e.target.value }))}
                          />
                          <p className="text-xs text-[rgb(130,130,150)] mt-1">
                            Leave empty to only require server join
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Telegram Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-400" />
                      Telegram Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.requiresTelegram}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, requiresTelegram: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.requiresTelegram ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.requiresTelegram ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm">Require Telegram Join</p>
                        <p className="text-[rgb(130,130,150)] text-xs">Must join Telegram group/channel</p>
                      </div>
                    </label>

                    {form.requiresTelegram && (
                      <Input
                        required={form.requiresTelegram}
                        placeholder="https://t.me/yourgroup or @yourgroup"
                        value={form.telegramGroup}
                        onChange={(e) => setForm((f) => ({ ...f, telegramGroup: e.target.value }))}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Role Multipliers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="w-5 h-5 text-green-400" />
                      Role Multipliers
                      <Badge variant="outline" className="ml-auto">Optional</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[rgb(130,130,150)]">
                      Give extra entries to users with specific Discord roles
                    </p>

                    {roleMultipliers.map((role, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          placeholder="Role ID"
                          value={role.roleId}
                          onChange={(e) => updateRoleMultiplier(index, "roleId", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Role Name"
                          value={role.roleName}
                          onChange={(e) => updateRoleMultiplier(index, "roleName", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="5x"
                          value={role.multiplier}
                          onChange={(e) => updateRoleMultiplier(index, "multiplier", Number(e.target.value))}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeRoleMultiplier(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRoleMultiplier}
                      className="w-full"
                    >
                      + Add Role Multiplier
                    </Button>
                  </CardContent>
                </Card>

                {/* Privacy & Team Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-yellow-400" />
                      Privacy & Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.isPrivate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, isPrivate: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.isPrivate ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.isPrivate ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm flex items-center gap-2">
                          <EyeOff className="w-4 h-4" />
                          Private Giveaway
                        </p>
                        <p className="text-[rgb(130,130,150)] text-xs">
                          Only visible to those with direct link
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={form.hideEntryCount}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, hideEntryCount: e.target.checked }))
                          }
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${
                            form.hideEntryCount ? "bg-purple-600" : "bg-[rgb(40,40,55)]"
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.hideEntryCount ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[rgb(200,200,210)] font-medium text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Hide Entry Count
                        </p>
                        <p className="text-[rgb(130,130,150)] text-xs">
                          Don't show total number of entries
                        </p>
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        Team Spots (optional)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="5"
                        value={form.teamSpots}
                        onChange={(e) => setForm((f) => ({ ...f, teamSpots: e.target.value }))}
                      />
                      <p className="text-xs text-[rgb(130,130,150)] mt-1">
                        Reserve spots for your team before drawing public winners
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Eligibility */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        {form.status === "DRAFT" ? "Save Draft" : "Publish Giveaway"}
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
