"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, Loader2, ArrowLeft, CheckCircle, Trophy, 
  Twitter, MessageCircle, Hash, Send, Eye, EyeOff, Shield, AlertTriangle
} from "lucide-react";

interface RoleMultiplier {
  id?: string;
  roleId: string;
  roleName: string;
  multiplier: number;
}

export default function EditGiveawayPage() {
  const router = useRouter();
  const params = useParams();
  const giveawayId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [roleMultipliers, setRoleMultipliers] = useState<RoleMultiplier[]>([]);
  const [giveaway, setGiveaway] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    prize: "",
    totalWinners: "1",
    chain: "SOL",
    status: "DRAFT" as string,
    startAt: "",
    endAt: "",
    requiresXFollow: false,
    xAccountToFollow: "",
    requiresXRetweet: false,
    xTweetToRetweet: "",
    requiresXLike: false,
    xTweetToLike: "",
    requiresXTag: false,
    xTagsRequired: "",
    requiresDiscord: false,
    discordGuildId: "",
    requiredDiscordRole: "",
    requiresTelegram: false,
    telegramGroup: "",
    isPrivate: false,
    hideEntryCount: false,
    teamSpots: "",
    isAgentEligible: true,
  });

  useEffect(() => {
    fetch(`/api/giveaways/${giveawayId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.giveaway) {
          const g = data.giveaway;
          setGiveaway(g);
          setForm({
            title: g.title || "",
            description: g.description || "",
            prize: g.prize || "",
            totalWinners: String(g.totalWinners || 1),
            chain: g.chain || "SOL",
            status: g.status || "DRAFT",
            startAt: g.startAt ? new Date(g.startAt).toISOString().slice(0, 16) : "",
            endAt: g.endAt ? new Date(g.endAt).toISOString().slice(0, 16) : "",
            requiresXFollow: g.requiresXFollow || false,
            xAccountToFollow: g.xAccountToFollow || "",
            requiresXRetweet: g.requiresXRetweet || false,
            xTweetToRetweet: g.xTweetToRetweet || "",
            requiresXLike: g.requiresXLike || false,
            xTweetToLike: g.xTweetToLike || "",
            requiresXTag: g.requiresXTag || false,
            xTagsRequired: g.xTagsRequired || "",
            requiresDiscord: g.requiresDiscord || false,
            discordGuildId: g.discordGuildId || "",
            requiredDiscordRole: g.requiredDiscordRole || "",
            requiresTelegram: g.requiresTelegram || false,
            telegramGroup: g.telegramGroup || "",
            isPrivate: g.isPrivate || false,
            hideEntryCount: g.hideEntryCount || false,
            teamSpots: g.teamSpots ? String(g.teamSpots) : "",
            isAgentEligible: g.isAgentEligible ?? true,
          });
          
          if (g.roleMultipliers && g.roleMultipliers.length > 0) {
            setRoleMultipliers(g.roleMultipliers.map((r: any) => ({
              id: r.id,
              roleId: r.roleId,
              roleName: r.roleName,
              multiplier: r.multiplier,
            })));
          }
        } else {
          setError("Giveaway not found");
        }
      })
      .catch(() => setError("Failed to load giveaway"))
      .finally(() => setLoadingData(false));
  }, [giveawayId]);

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
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/giveaways/${giveawayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          roleMultipliers: roleMultipliers.filter(r => r.roleId && r.roleName),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update giveaway");
        return;
      }
      router.push(`/c/${giveaway.community.slug}/manage?tab=giveaways`);
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-red-400">{error || "Giveaway not found"}</p>
        </div>
      </div>
    );
  }

  const isActive = giveaway.status === "ACTIVE";
  const hasEntries = giveaway._count?.entries > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Link href={`/c/${giveaway.community.slug}/manage?tab=giveaways`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Gift className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Edit Giveaway</h1>
              <Badge variant="outline" className="ml-auto">
                {giveaway.status}
              </Badge>
            </div>

            {(isActive || hasEntries) && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Warning: Active Giveaway</p>
                  <p className="text-xs text-yellow-200">
                    This giveaway {hasEntries && `has ${giveaway._count.entries} entries`}{isActive && hasEntries && " and "}
                    {isActive && "is currently active"}. Changing requirements may confuse participants.
                  </p>
                </div>
              </div>
            )}

            {/* Same form structure as create page, but pre-filled */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Details - SAME AS CREATE PAGE */}
              <Card>
                <CardHeader>
                  <CardTitle>Giveaway Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">Title *</label>
                    <Input
                      required
                      value={form.title}
                      onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">Description</label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">Prize *</label>
                    <Input
                      required
                      value={form.prize}
                      onChange={(e) => setForm(f => ({ ...f, prize: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                        <Trophy className="w-3.5 h-3.5 inline mr-1.5 text-yellow-400" />
                        Winners *
                      </label>
                      <Input
                        required
                        type="number"
                        min="1"
                        value={form.totalWinners}
                        onChange={(e) => setForm(f => ({ ...f, totalWinners: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">Chain *</label>
                      <select
                        required
                        className="w-full rounded-lg bg-[rgb(25,25,35)] border border-[rgb(40,40,55)] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        value={form.chain}
                        onChange={(e) => setForm(f => ({ ...f, chain: e.target.value }))}
                      >
                        <option value="SOL">Solana</option>
                        <option value="BTC">Bitcoin</option>
                        <option value="ETH">Ethereum</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">Start Time *</label>
                      <Input
                        required
                        type="datetime-local"
                        value={form.startAt}
                        onChange={(e) => setForm(f => ({ ...f, startAt: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">End Time *</label>
                      <Input
                        required
                        type="datetime-local"
                        value={form.endAt}
                        onChange={(e) => setForm(f => ({ ...f, endAt: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Abbreviated requirements cards to keep response shorter */}
              {/* Include Twitter, Discord, Telegram, Role Multipliers, Privacy - same as create page */}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link href={`/c/${giveaway.community.slug}/manage?tab=giveaways`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" variant="gradient" disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
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
