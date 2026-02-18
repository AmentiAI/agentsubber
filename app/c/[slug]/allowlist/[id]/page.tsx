"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  List,
  Users,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Twitter,
  Download,
} from "lucide-react";
import Link from "next/link";
import { timeUntil } from "@/lib/utils";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

export default function AllowlistPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const { data: session } = useSession();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    fetch(`/api/allowlists/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) setCampaign(data.campaign);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = session?.user?.id === campaign?.community?.ownerUserId;
  const isActive = campaign?.status === "ACTIVE";
  const isFull = campaign && campaign.filledSpots >= campaign.totalSpots;
  const hasClosed = campaign?.closesAt && new Date(campaign.closesAt) < new Date();
  const pct = campaign ? Math.round((campaign.filledSpots / campaign.totalSpots) * 100) : 0;

  const handleEnter = async () => {
    setError("");
    if (!walletAddress.trim()) {
      setError("Wallet address is required.");
      return;
    }
    setEntering(true);
    try {
      const res = await fetch(`/api/allowlists/${id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: walletAddress.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntered(true);
        setCampaign((prev: any) => ({
          ...prev,
          filledSpots: prev.filledSpots + 1,
        }));
      } else {
        setError(data.error ?? "Failed to register.");
      }
    } finally {
      setEntering(false);
    }
  };

  const handleExport = async () => {
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
    a.download = `${campaign.name}-allowlist.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  if (!campaign) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Allowlist Not Found</h2>
          <Link href={`/c/${slug}`}>
            <Button variant="secondary">Back to Community</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    campaign.status === "ACTIVE" && !isFull && !hasClosed
      ? "open"
      : campaign.status === "CLOSED" || isFull || hasClosed
      ? "closed"
      : campaign.status.toLowerCase();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href={`/c/${slug}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-[rgb(130,130,150)] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to {campaign.community.name}
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {statusLabel === "open" ? (
                  <Badge variant="live">Open</Badge>
                ) : statusLabel === "closed" ? (
                  <Badge variant="secondary">Closed</Badge>
                ) : (
                  <Badge variant="secondary">{campaign.status}</Badge>
                )}
                <Badge variant="secondary">{campaign.entryMethod}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{campaign.name}</h1>
              <p className="text-[rgb(180,180,200)] leading-relaxed">{campaign.description}</p>
            </div>

            {/* Progress */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Spots Filled</span>
                  <span className="text-sm text-[rgb(130,130,150)]">
                    {campaign.filledSpots} / {campaign.totalSpots}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[rgb(30,30,40)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-[rgb(130,130,150)]">
                  <span>{pct}% filled</span>
                  <span>{campaign.totalSpots - campaign.filledSpots} spots remaining</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{campaign._count?.entries ?? campaign.filledSpots}</div>
                  <div className="text-xs text-[rgb(130,130,150)]">Registrations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <List className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{campaign.totalSpots}</div>
                  <div className="text-xs text-[rgb(130,130,150)]">Total Spots</div>
                </CardContent>
              </Card>
              {campaign.closesAt && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <div className="text-sm font-bold text-white">
                      {hasClosed ? "Closed" : timeUntil(new Date(campaign.closesAt))}
                    </div>
                    <div className="text-xs text-[rgb(130,130,150)]">Until close</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Entry card */}
            <Card className={isActive && !isFull && !hasClosed ? "border-indigo-500/30" : ""}>
              <CardContent className="p-5">
                {!session ? (
                  <div className="text-center">
                    <List className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                    <p className="text-sm text-[rgb(200,200,210)] mb-4">
                      Sign in to register for this allowlist.
                    </p>
                    <Link href="/login">
                      <Button variant="gradient" className="w-full gap-2">
                        <Twitter className="w-4 h-4" />
                        Connect with X
                      </Button>
                    </Link>
                  </div>
                ) : entered ? (
                  <div className="text-center py-2">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white mb-1">You&apos;re on the list!</p>
                    <p className="text-xs text-[rgb(130,130,150)]">
                      Your wallet has been registered.
                    </p>
                  </div>
                ) : !isActive || isFull || hasClosed ? (
                  <div className="text-center py-2">
                    <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                    <p className="text-sm text-[rgb(200,200,210)]">
                      {isFull ? "This allowlist is full." : hasClosed ? "Registration has closed." : "This allowlist is not open."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Register Wallet</h3>
                    <div>
                      <label className="text-xs text-[rgb(130,130,150)] mb-1 block">
                        Wallet Address *
                      </label>
                      <Input
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Your SOL or BTC address"
                      />
                      <p className="text-xs text-[rgb(100,100,120)] mt-1">
                        {campaign.community.chain === "SOL"
                          ? "Solana address (e.g. 4xC...)"
                          : "Bitcoin ordinals address (e.g. bc1p...)"}
                      </p>
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {error}
                      </p>
                    )}
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={handleEnter}
                      disabled={entering}
                    >
                      {entering ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Register Wallet
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner export */}
            {isOwner && (
              <Card className="border-orange-500/20">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Owner Tools</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleExport}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Community</span>
                  <Link href={`/c/${slug}`} className="text-indigo-400 hover:underline">
                    {campaign.community.name}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Method</span>
                  <span className="text-white">{campaign.entryMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Chain</span>
                  <span className="text-white">{campaign.community.chain}</span>
                </div>
                {campaign.closesAt && (
                  <div className="flex justify-between">
                    <span className="text-[rgb(130,130,150)]">Closes</span>
                    <span className="text-white">{format(new Date(campaign.closesAt), "MMM d, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
