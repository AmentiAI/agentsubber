"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import dynamic from "next/dynamic";

const ImageCropModal = dynamic(() => import("@/components/ui/ImageCropModal"), { ssr: false });
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Gift,
  List,
  ShoppingBag,
  Handshake,
  Plus,
  Loader2,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Globe,
  ArrowLeft,
  Download,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatNumber, timeUntil } from "@/lib/utils";
import { format } from "date-fns";

type Tab = "overview" | "giveaways" | "allowlists" | "presales" | "collabs" | "settings";

export default function ManageCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCommunity = useCallback(async () => {
    try {
      // First get community by slug from the public endpoint
      const res = await fetch(`/api/communities?slug=${slug}`);
      const data = await res.json();
      // Find the matching community
      const found = data.communities?.find((c: any) => c.slug === slug);
      if (!found) {
        setError("Community not found or you don't have access.");
        return;
      }
      // Fetch full community data with management details
      const detailed = await fetch(`/api/communities/${found.id}`);
      const detailedData = await detailed.json();
      if (detailedData.community) {
        setCommunity(detailedData.community);
      }
    } catch {
      setError("Failed to load community.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Globe className="w-4 h-4" /> },
    { id: "giveaways", label: "Giveaways", icon: <Gift className="w-4 h-4" /> },
    { id: "allowlists", label: "Allowlists", icon: <List className="w-4 h-4" /> },
    { id: "presales", label: "Presales", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "collabs", label: "Collabs", icon: <Handshake className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[rgb(130,130,150)] mb-6">{error || "You don't have permission to manage this community."}</p>
          <Link href="/dashboard/communities">
            <Button variant="secondary">Back to Communities</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/c/${slug}`}>
              <Button variant="ghost" size="sm" className="gap-2 text-[rgb(130,130,150)]">
                <ArrowLeft className="w-4 h-4" />
                View Public Page
              </Button>
            </Link>
            <div className="w-px h-6 bg-[rgb(40,40,55)]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                {community.logoUrl ? (
                  <img src={community.logoUrl} alt={community.name} className="w-full h-full object-cover" style={{ objectPosition: community.logoPosition ?? "50% 50%" }} />
                ) : (
                  community.name[0].toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{community.name}</h1>
                <p className="text-xs text-[rgb(130,130,150)]">Community Manager</p>
              </div>
            </div>
          </div>
          <Link href={`/c/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Public Page
            </Button>
          </Link>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 p-1 bg-[rgb(16,16,22)] rounded-xl border border-[rgb(40,40,55)] mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(30,30,40)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab community={community} />}
        {activeTab === "giveaways" && (
          <GiveawaysTab community={community} onRefresh={fetchCommunity} />
        )}
        {activeTab === "allowlists" && (
          <AllowlistsTab community={community} onRefresh={fetchCommunity} />
        )}
        {activeTab === "presales" && <PresalesTab community={community} />}
        {activeTab === "collabs" && <CollabsTab community={community} />}
        {activeTab === "settings" && (
          <SettingsTab community={community} onSaved={fetchCommunity} />
        )}
      </div>
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab({ community }: { community: any }) {
  const stats = [
    { label: "Total Giveaways", value: community._count.giveaways, icon: <Gift className="w-5 h-5 text-purple-400" /> },
    { label: "Allowlist Campaigns", value: community._count.allowlistCampaigns, icon: <List className="w-5 h-5 text-indigo-400" /> },
    { label: "Presales", value: community._count.presales, icon: <ShoppingBag className="w-5 h-5 text-green-400" /> },
    { label: "Members", value: formatNumber(community.memberCount), icon: <Users className="w-5 h-5 text-blue-400" /> },
  ];

  const activeGiveaways = community.giveaways?.filter((g: any) => g.status === "ACTIVE") ?? [];
  const activeAllowlists = community.allowlistCampaigns?.filter((a: any) => a.status === "ACTIVE") ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[rgb(30,30,40)] flex items-center justify-center">
                  {s.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-[rgb(130,130,150)] mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active giveaways */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-purple-400" />
              Active Giveaways
              {activeGiveaways.length > 0 && (
                <Badge variant="live" className="ml-auto">{activeGiveaways.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeGiveaways.length === 0 ? (
              <p className="text-sm text-[rgb(130,130,150)] py-4 text-center">No active giveaways</p>
            ) : (
              <div className="space-y-3">
                {activeGiveaways.slice(0, 5).map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{g.title}</p>
                      <p className="text-xs text-[rgb(130,130,150)]">
                        {g._count.entries} entries · ends {timeUntil(new Date(g.endAt))}
                      </p>
                    </div>
                    <Badge variant="live">Live</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active allowlists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <List className="w-4 h-4 text-indigo-400" />
              Open Allowlists
              {activeAllowlists.length > 0 && (
                <Badge variant="success" className="ml-auto">{activeAllowlists.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAllowlists.length === 0 ? (
              <p className="text-sm text-[rgb(130,130,150)] py-4 text-center">No open allowlists</p>
            ) : (
              <div className="space-y-3">
                {activeAllowlists.slice(0, 5).map((a: any) => {
                  const pct = Math.round((a.filledSpots / a.totalSpots) * 100);
                  return (
                    <div key={a.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-white font-medium">{a.name}</p>
                        <span className="text-xs text-[rgb(130,130,150)]">{a.filledSpots}/{a.totalSpots}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[rgb(30,30,40)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Giveaways Tab ─── */
function GiveawaysTab({ community, onRefresh }: { community: any; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const giveaways = community.giveaways ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: community.id,
          ...form,
          totalWinners: Number(form.totalWinners),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: "", description: "", prize: "", totalWinners: "1", endAt: "", requiresXFollow: false, xAccountToFollow: "", isAgentEligible: true });
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraw = async (giveawayId: string) => {
    if (!confirm("Draw winners now? This cannot be undone.")) return;
    const res = await fetch(`/api/giveaways/${giveawayId}/draw`, { method: "POST" });
    if (res.ok) onRefresh();
  };

  const handleDelete = async (giveawayId: string) => {
    if (!confirm("Delete this giveaway?")) return;
    const res = await fetch(`/api/giveaways/${giveawayId}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const statusBadge = (status: string) => {
    if (status === "ACTIVE") return <Badge variant="live">Live</Badge>;
    if (status === "COMPLETED") return <Badge variant="success">Completed</Badge>;
    if (status === "UPCOMING") return <Badge variant="secondary">Upcoming</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Giveaways ({giveaways.length})</h2>
        <Button variant="gradient" size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          New Giveaway
        </Button>
      </div>

      {showForm && (
        <Card className="border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-sm">Create Giveaway</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Title *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Whitelist Giveaway"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Prize *</label>
                  <Input
                    value={form.prize}
                    onChange={(e) => setForm({ ...form, prize: e.target.value })}
                    placeholder="e.g. 1x WL Spot"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Giveaway details..."
                  rows={2}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Winners *</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.totalWinners}
                    onChange={(e) => setForm({ ...form, totalWinners: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">End Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[rgb(200,200,210)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresXFollow}
                    onChange={(e) => setForm({ ...form, requiresXFollow: e.target.checked })}
                    className="accent-purple-500"
                  />
                  Require X Follow
                </label>
                <label className="flex items-center gap-2 text-sm text-[rgb(200,200,210)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAgentEligible}
                    onChange={(e) => setForm({ ...form, isAgentEligible: e.target.checked })}
                    className="accent-purple-500"
                  />
                  Allow Agent Entries
                </label>
              </div>
              {form.requiresXFollow && (
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">X Account to Follow</label>
                  <Input
                    value={form.xAccountToFollow}
                    onChange={(e) => setForm({ ...form, xAccountToFollow: e.target.value })}
                    placeholder="@handle (without @)"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Giveaway"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {giveaways.length === 0 ? (
        <div className="text-center py-16 text-[rgb(130,130,150)]">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No giveaways yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {giveaways.map((g: any) => (
            <Card key={g.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(g.status)}
                      <h3 className="text-sm font-semibold text-white truncate">{g.title}</h3>
                    </div>
                    <p className="text-xs text-purple-400 mb-1">Prize: {g.prize}</p>
                    <div className="flex items-center gap-4 text-xs text-[rgb(130,130,150)]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {g._count.entries} entries
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {g.totalWinners} winner{g.totalWinners !== 1 ? "s" : ""}
                      </span>
                      {g.status !== "COMPLETED" && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeUntil(new Date(g.endAt))}
                        </span>
                      )}
                      {g.status === "COMPLETED" && (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {g._count.winners} drawn
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {g.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="gradient"
                        className="text-xs"
                        onClick={() => handleDraw(g.id)}
                      >
                        <Trophy className="w-3.5 h-3.5 mr-1" />
                        Draw Winners
                      </Button>
                    )}
                    <Link href={`/c/${community.slug}/giveaways/${g.id}`} target="_blank">
                      <Button size="sm" variant="outline" className="text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    {g.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => handleDelete(g.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Allowlists Tab ─── */
function AllowlistsTab({ community, onRefresh }: { community: any; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    totalSpots: "100",
    entryMethod: "FCFS",
    closesAt: "",
  });

  const allowlists = community.allowlistCampaigns ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/allowlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: community.id, ...form }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", description: "", totalSpots: "100", entryMethod: "FCFS", closesAt: "" });
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm("Close this allowlist? No more entries will be accepted.")) return;
    const res = await fetch(`/api/allowlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    if (res.ok) onRefresh();
  };

  const handleExport = async (id: string, name: string) => {
    const res = await fetch(`/api/allowlists/${id}?entries=true`);
    const data = await res.json();
    const entries = data.campaign?.entries ?? [];
    const csv = [
      "Wallet Address,X Handle,Entered At",
      ...entries.map((e: any) =>
        `${e.walletAddress},${e.user?.xHandle ?? ""},${format(new Date(e.createdAt), "yyyy-MM-dd HH:mm")}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-allowlist.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    if (status === "ACTIVE") return <Badge variant="live">Open</Badge>;
    if (status === "CLOSED") return <Badge variant="secondary">Closed</Badge>;
    if (status === "RAFFLE_PENDING") return <Badge variant="warning">Raffle Pending</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Allowlists ({allowlists.length})</h2>
        <Button variant="gradient" size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          New Allowlist
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-sm">Create Allowlist Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Campaign Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Genesis Allowlist"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Total Spots *</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.totalSpots}
                    onChange={(e) => setForm({ ...form, totalSpots: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's included with the allowlist spot?"
                  rows={2}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Entry Method</label>
                  <select
                    value={form.entryMethod}
                    onChange={(e) => setForm({ ...form, entryMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(10,10,15)] border border-[rgb(40,40,55)] text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="FCFS">First Come First Served</option>
                    <option value="RAFFLE">Raffle</option>
                    <option value="COLLAB">Collab</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Closes At</label>
                  <Input
                    type="datetime-local"
                    value={form.closesAt}
                    onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Campaign"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {allowlists.length === 0 ? (
        <div className="text-center py-16 text-[rgb(130,130,150)]">
          <List className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No allowlist campaigns yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allowlists.map((a: any) => {
            const pct = Math.round((a.filledSpots / a.totalSpots) * 100);
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(a.status)}
                        <h3 className="text-sm font-semibold text-white">{a.name}</h3>
                        <Badge variant="secondary" className="text-xs">{a.entryMethod}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mb-2 text-xs text-[rgb(130,130,150)]">
                        <span>{a.filledSpots} / {a.totalSpots} spots ({pct}%)</span>
                        {a._count?.entries !== undefined && (
                          <span>{a._count.entries} entries</span>
                        )}
                        {a.closesAt && <span>Closes {timeUntil(new Date(a.closesAt))}</span>}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[rgb(30,30,40)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => handleExport(a.id, a.name)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </Button>
                      {a.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-orange-400 hover:text-orange-300"
                          onClick={() => handleClose(a.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Presales Tab ─── */
function PresalesTab({ community }: { community: any }) {
  const presales = community.presales ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Presales ({presales.length})</h2>
        <Link href="/dashboard/presales/new">
          <Button variant="gradient" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Presale
          </Button>
        </Link>
      </div>

      {presales.length === 0 ? (
        <div className="text-center py-16 text-[rgb(130,130,150)]">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No presales yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {presales.map((p: any) => {
            const pct = Math.round((p.soldCount / p.totalSupply) * 100);
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                    <Badge variant={p.status === "ACTIVE" ? "live" : "secondary"}>{p.status}</Badge>
                  </div>
                  <div className="text-xs text-green-400 mb-2">
                    {p.priceSOL ? `${p.priceSOL} SOL` : ""}
                    {p.priceBTC ? `${p.priceBTC} BTC` : ""}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[rgb(130,130,150)] mb-1">
                    <span>{p.soldCount} / {p.totalSupply} sold</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[rgb(30,30,40)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Collabs Tab ─── */
function CollabsTab({ community }: { community: any }) {
  const [collabs, setCollabs] = useState<any[]>([]);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [targetSlug, setTargetSlug] = useState("");
  const [spotsOffered, setSpotsOffered] = useState("10");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    const fetchCollabs = async () => {
      const [inboxRes, outboxRes] = await Promise.all([
        fetch(`/api/collab?communityId=${community.id}&type=inbox`),
        fetch(`/api/collab?communityId=${community.id}&type=outbox`),
      ]);
      const [inboxData, outboxData] = await Promise.all([inboxRes.json(), outboxRes.json()]);
      setCollabs(inboxData.collabs ?? []);
      setOutbox(outboxData.collabs ?? []);
      setLoading(false);
    };
    fetchCollabs();
  }, [community.id]);

  const handleRespond = async (collabId: string, status: "ACCEPTED" | "DECLINED") => {
    const res = await fetch("/api/collab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collabId, status }),
    });
    if (res.ok) {
      setCollabs((prev) =>
        prev.map((c) => (c.id === collabId ? { ...c, status } : c))
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    setSubmitting(true);
    try {
      // Find target community by slug
      const searchRes = await fetch(`/api/communities?slug=${targetSlug}`);
      const searchData = await searchRes.json();
      const target = searchData.communities?.find((c: any) => c.slug === targetSlug);
      if (!target) {
        setSendError("Community not found. Check the slug.");
        return;
      }

      const res = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCommunityId: community.id,
          toCommunityId: target.id,
          spotsOffered: Number(spotsOffered),
          message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOutbox((prev) => [data.collab, ...prev]);
        setShowSendForm(false);
        setTargetSlug("");
        setSpotsOffered("10");
        setMessage("");
      } else {
        setSendError(data.error ?? "Failed to send offer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
    if (status === "ACCEPTED") return <Badge variant="success">Accepted</Badge>;
    if (status === "DECLINED") return <Badge variant="secondary">Declined</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Collabs</h2>
        <Button variant="gradient" size="sm" className="gap-2" onClick={() => setShowSendForm(!showSendForm)}>
          <Plus className="w-4 h-4" />
          Send Offer
        </Button>
      </div>

      {showSendForm && (
        <Card className="border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-sm">Send Collab Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Target Community Slug *</label>
                  <Input
                    value={targetSlug}
                    onChange={(e) => setTargetSlug(e.target.value)}
                    placeholder="community-slug"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Spots Offered *</label>
                  <Input
                    type="number"
                    min="1"
                    value={spotsOffered}
                    onChange={(e) => setSpotsOffered(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce your project and propose the collab..."
                  rows={3}
                />
              </div>
              {sendError && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {sendError}
                </p>
              )}
              <div className="flex gap-3">
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Offer"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowSendForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inbox */}
          <div>
            <h3 className="text-sm font-semibold text-[rgb(130,130,150)] mb-3 uppercase tracking-wider">
              Inbox ({collabs.length})
            </h3>
            {collabs.length === 0 ? (
              <div className="text-center py-10 text-[rgb(130,130,150)] text-sm border border-[rgb(40,40,55)] rounded-xl">
                No incoming collab offers
              </div>
            ) : (
              <div className="space-y-3">
                {collabs.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {c.fromCommunity.name}
                          </p>
                          <p className="text-xs text-purple-400">{c.spotsOffered} spots offered</p>
                        </div>
                        {statusBadge(c.status)}
                      </div>
                      {c.message && (
                        <p className="text-xs text-[rgb(180,180,200)] mb-3 bg-[rgb(20,20,28)] p-2 rounded-lg">
                          {c.message}
                        </p>
                      )}
                      {c.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="gradient"
                            className="flex-1 text-xs"
                            onClick={() => handleRespond(c.id, "ACCEPTED")}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-xs text-red-400 hover:text-red-300"
                            onClick={() => handleRespond(c.id, "DECLINED")}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Outbox */}
          <div>
            <h3 className="text-sm font-semibold text-[rgb(130,130,150)] mb-3 uppercase tracking-wider">
              Sent ({outbox.length})
            </h3>
            {outbox.length === 0 ? (
              <div className="text-center py-10 text-[rgb(130,130,150)] text-sm border border-[rgb(40,40,55)] rounded-xl">
                No sent offers yet
              </div>
            ) : (
              <div className="space-y-3">
                {outbox.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            → {c.toCommunity.name}
                          </p>
                          <p className="text-xs text-purple-400">{c.spotsOffered} spots offered</p>
                        </div>
                        {statusBadge(c.status)}
                      </div>
                      {c.message && (
                        <p className="text-xs text-[rgb(180,180,200)] mt-2 bg-[rgb(20,20,28)] p-2 rounded-lg">
                          {c.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Settings Tab ─── */
function SettingsTab({ community, onSaved }: { community: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: community.name ?? "",
    description: community.description ?? "",
    twitterHandle: community.twitterHandle ?? "",
    discordInvite: community.discordInvite ?? "",
    telegramLink: community.telegramLink ?? "",
    websiteUrl: community.websiteUrl ?? "",
    instagramUrl: community.instagramUrl ?? "",
    youtubeUrl: community.youtubeUrl ?? "",
    magicEdenUrl: community.magicEdenUrl ?? "",
    tensorUrl: community.tensorUrl ?? "",
    logoUrl: community.logoUrl ?? "",
    logoPosition: community.logoPosition ?? "50% 50%",
    bannerUrl: community.bannerUrl ?? "",
    bannerPosition: community.bannerPosition ?? "50% 50%",
    tags: community.tags ?? "",
    announcementText: community.announcementText ?? "",
    mintDate: community.mintDate ?? "",
    mintPrice: community.mintPrice ?? "",
    totalSupply: community.totalSupply != null ? String(community.totalSupply) : "",
    accentColor: community.accentColor ?? "#8B5CF6",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropModal, setCropModal] = useState<{
    src: string;
    field: "logoUrl" | "bannerUrl";
  } | null>(null);

  const handleFileUpload = (
    field: "logoUrl" | "bannerUrl",
    file: File | null
  ) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      // Open crop modal instead of saving directly
      setCropModal({ src: e.target?.result as string, field });
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = (croppedDataUrl: string) => {
    if (!cropModal) return;
    setForm((prev) => ({ ...prev, [cropModal.field]: croppedDataUrl }));
    setCropModal(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalSupply: form.totalSupply !== "" ? Number(form.totalSupply) : null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved();
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Crop modal — rendered outside the form flow */}
      {cropModal && (
        <ImageCropModal
          src={cropModal.src}
          aspect={cropModal.field === "logoUrl" ? "square" : "banner"}
          onDone={handleCropDone}
          onCancel={() => {
            setCropModal(null);
            // Reset the file input so re-selecting the same file works
            if (cropModal.field === "logoUrl" && logoInputRef.current) logoInputRef.current.value = "";
            if (cropModal.field === "bannerUrl" && bannerInputRef.current) bannerInputRef.current.value = "";
          }}
        />
      )}
      <h2 className="text-lg font-bold text-white mb-6">Community Settings</h2>
      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Branding ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ── Logo ── */}
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-2 block font-medium">Logo</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-[rgb(60,60,80)] bg-[rgb(16,16,22)] flex items-center justify-center overflow-hidden shrink-0"
                >
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: form.logoPosition }}
                    />
                  ) : (
                    <Upload className="w-6 h-6 text-[rgb(80,80,100)]" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {form.logoUrl ? "Change" : "Upload Logo"}
                    </Button>
                    {form.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-red-400 hover:text-red-300"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, logoUrl: "", logoPosition: "50% 50%" }));
                          if (logoInputRef.current) logoInputRef.current.value = "";
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-[rgb(100,100,120)]">PNG, JPG, GIF · max 2 MB</p>

                  {/* Position sliders — only shown when logo is set */}
                  {form.logoUrl && (
                    <PositionPicker
                      value={form.logoPosition}
                      onChange={(v) => setForm((prev) => ({ ...prev, logoPosition: v }))}
                      label="Focal Point"
                    />
                  )}
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload("logoUrl", e.target.files?.[0] ?? null)}
              />
            </div>

            {/* ── Banner ── */}
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-2 block font-medium">Banner</label>

              {/* Upload zone */}
              <div
                className="w-full h-28 rounded-xl border-2 border-dashed border-[rgb(60,60,80)] bg-[rgb(16,16,22)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500/50 transition-colors relative group"
                onClick={() => bannerInputRef.current?.click()}
              >
                {form.bannerUrl ? (
                  <>
                    <img
                      src={form.bannerUrl}
                      alt="Banner"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: form.bannerPosition }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-white text-sm font-medium">Change Banner</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[rgb(80,80,100)]">
                    <Upload className="w-7 h-7" />
                    <span className="text-sm">Click to upload banner</span>
                    <span className="text-xs">PNG, JPG, GIF · max 5 MB · Recommended: 1400×400</span>
                  </div>
                )}
              </div>

              {/* Position + remove — only when banner set */}
              {form.bannerUrl && (
                <div className="mt-3 space-y-3">
                  <BannerPositionPicker
                    bannerUrl={form.bannerUrl}
                    value={form.bannerPosition}
                    onChange={(v) => setForm((prev) => ({ ...prev, bannerPosition: v }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-red-400 hover:text-red-300"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, bannerUrl: "", bannerPosition: "50% 50%" }));
                      if (bannerInputRef.current) bannerInputRef.current.value = "";
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove Banner
                  </Button>
                </div>
              )}

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload("bannerUrl", e.target.files?.[0] ?? null)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Identity ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Community Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                placeholder="Tell people what your community is about..."
              />
            </div>
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Tags</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. NFT, PFP, Gaming, Bitcoin"
              />
              <p className="text-xs text-[rgb(100,100,120)] mt-1">Comma-separated tags shown on your public page</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Collection Info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Collection Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Total Supply</label>
                <Input
                  type="number"
                  min="0"
                  value={form.totalSupply}
                  onChange={(e) => setForm({ ...form, totalSupply: e.target.value })}
                  placeholder="e.g. 10000"
                />
              </div>
              <div>
                <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Mint Price</label>
                <Input
                  value={form.mintPrice}
                  onChange={(e) => setForm({ ...form, mintPrice: e.target.value })}
                  placeholder="e.g. 0.05 SOL"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Mint Date</label>
              <Input
                value={form.mintDate}
                onChange={(e) => setForm({ ...form, mintDate: e.target.value })}
                placeholder="e.g. Q2 2025 or June 2025"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Social Links ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "twitterHandle", emoji: "🐦", label: "X (Twitter)", placeholder: "@handle (without @)" },
              { key: "discordInvite", emoji: "💬", label: "Discord", placeholder: "https://discord.gg/..." },
              { key: "telegramLink", emoji: "✈️", label: "Telegram", placeholder: "https://t.me/..." },
              { key: "websiteUrl", emoji: "🌐", label: "Website", placeholder: "https://..." },
              { key: "instagramUrl", emoji: "📸", label: "Instagram", placeholder: "https://instagram.com/..." },
              { key: "youtubeUrl", emoji: "▶️", label: "YouTube", placeholder: "https://youtube.com/..." },
              { key: "magicEdenUrl", emoji: "🟣", label: "Magic Eden", placeholder: "https://magiceden.io/..." },
              { key: "tensorUrl", emoji: "⚡", label: "Tensor", placeholder: "https://tensor.trade/..." },
            ].map(({ key, emoji, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-[rgb(130,130,150)] mb-1 flex items-center gap-1.5 block">
                  <span>{emoji}</span>
                  <span>{label}</span>
                </label>
                <Input
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Appearance ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-[rgb(130,130,150)] mb-2 block">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-[rgb(40,40,55)] bg-transparent"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-[rgb(40,40,55)]"
                  style={{ backgroundColor: form.accentColor }}
                />
                <span className="text-sm text-white font-mono">{form.accentColor}</span>
              </div>
              <p className="text-xs text-[rgb(100,100,120)] mt-2">Used as highlight color on your public page</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Announcement ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.announcementText}
              onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
              rows={3}
              placeholder="Pin an announcement to the top of your public page..."
            />
            <p className="text-xs text-[rgb(100,100,120)] mt-2">Shows as a banner on your public page. Leave blank to hide.</p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="gradient" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
          {saved && (
            <span className="text-sm text-green-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

/* ─── PositionPicker — X/Y sliders for logo focal point ─── */
function PositionPicker({
  value,
  onChange,
  label = "Focal Point",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const parse = (v: string) => {
    const parts = v.split(" ");
    const x = parseFloat(parts[0]) || 50;
    const y = parseFloat(parts[1]) || 50;
    return { x, y };
  };
  const { x, y } = parse(value);

  const update = (axis: "x" | "y", num: number) => {
    const next = axis === "x" ? `${num}% ${y}%` : `${x}% ${num}%`;
    onChange(next);
  };

  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs text-[rgb(100,100,120)]">
        {label} — drag sliders to reposition image
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[rgb(130,130,150)] w-12">Left ↔ Right</span>
          <input
            type="range"
            min={0}
            max={100}
            value={x}
            onChange={(e) => update("x", Number(e.target.value))}
            className="flex-1 accent-purple-500 h-1.5 cursor-pointer"
          />
          <span className="text-xs text-[rgb(130,130,150)] w-8 text-right">{Math.round(x)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[rgb(130,130,150)] w-12">Top ↕ Bottom</span>
          <input
            type="range"
            min={0}
            max={100}
            value={y}
            onChange={(e) => update("y", Number(e.target.value))}
            className="flex-1 accent-purple-500 h-1.5 cursor-pointer"
          />
          <span className="text-xs text-[rgb(130,130,150)] w-8 text-right">{Math.round(y)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── BannerPositionPicker — live drag preview for banner ─── */
function BannerPositionPicker({
  bannerUrl,
  value,
  onChange,
}: {
  bannerUrl: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const parse = (v: string) => {
    const parts = v.split(" ");
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 };
  };
  const pos = parse(value);

  const updateFromEvent = (e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onChange(`${Math.round(x)}% ${Math.round(y)}%`);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    updateFromEvent(e);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    updateFromEvent(e);
  };
  const onMouseUp = () => { dragging.current = false; };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[rgb(100,100,120)]">
        Click or drag on the preview to set focal point
      </p>
      <div
        ref={containerRef}
        className="relative w-full h-24 rounded-xl overflow-hidden cursor-crosshair border border-[rgb(40,40,55)] select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          src={bannerUrl}
          alt="Banner position"
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: value }}
          draggable={false}
        />
        {/* Crosshair dot */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg bg-white/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/30"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />
        {/* Crosshair lines */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none"
          style={{ left: `${pos.x}%` }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-white/40 pointer-events-none"
          style={{ top: `${pos.y}%` }}
        />
        <div className="absolute bottom-1.5 right-2 text-[10px] text-white/60 font-mono pointer-events-none">
          {Math.round(pos.x)}% · {Math.round(pos.y)}%
        </div>
      </div>
      {/* Also expose Y-only slider for fine control */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[rgb(130,130,150)] w-16">Vertical</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos.y}
          onChange={(e) =>
            onChange(`${Math.round(pos.x)}% ${Number(e.target.value)}%`)
          }
          className="flex-1 accent-purple-500 h-1.5 cursor-pointer"
        />
        <span className="text-xs text-[rgb(130,130,150)] w-8 text-right">{Math.round(pos.y)}%</span>
      </div>
    </div>
  );
}
