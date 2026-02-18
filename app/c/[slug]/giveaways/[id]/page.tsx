"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Trophy,
  Users,
  Clock,
  Twitter,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { timeUntil } from "@/lib/utils";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { getPusherClient, CHANNELS, EVENTS } from "@/lib/pusher";

export default function GiveawayPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const { data: session } = useSession();

  const [giveaway, setGiveaway] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [xUsername, setXUsername] = useState(session?.user?.username ?? "");

  useEffect(() => {
    fetch(`/api/giveaways/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.giveaway) {
          setGiveaway(data.giveaway);
          setWinners(data.giveaway.winners ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ─── Pusher: subscribe to live updates ───
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;
    let channel: ReturnType<ReturnType<typeof getPusherClient>["subscribe"]>;
    try {
      const pusher = getPusherClient();
      channel = pusher.subscribe(CHANNELS.giveaway(id));

      // Live entry count
      channel.bind(EVENTS.ENTRY_COUNT, (data: { count: number }) => {
        setGiveaway((prev: any) =>
          prev ? { ...prev, _count: { ...prev._count, entries: data.count } } : prev
        );
      });

      // Winners announced — reveal them with a flash
      channel.bind(EVENTS.DRAW_COMPLETE, (data: { winners: any[] }) => {
        setWinners(data.winners);
        setGiveaway((prev: any) => prev ? { ...prev, status: "COMPLETED" } : prev);
      });
    } catch {}

    return () => {
      try { channel?.unbind_all(); channel?.unsubscribe(); } catch {}
    };
  }, [id]);

  const isOwner = session?.user?.id === giveaway?.community?.ownerUserId;
  const isActive = giveaway?.status === "ACTIVE";
  const isCompleted = giveaway?.status === "COMPLETED";
  const hasEnded = giveaway?.endAt && new Date(giveaway.endAt) < new Date();

  const handleEnter = async () => {
    setError("");
    setEntering(true);
    try {
      const res = await fetch(`/api/giveaways/${id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, xUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntered(true);
        setGiveaway((prev: any) => ({
          ...prev,
          _count: { ...prev._count, entries: (prev._count?.entries ?? 0) + 1 },
        }));
      } else {
        setError(data.error ?? "Failed to enter.");
      }
    } finally {
      setEntering(false);
    }
  };

  const handleDraw = async () => {
    if (!confirm("Draw winners now? This cannot be undone.")) return;
    setDrawing(true);
    try {
      const res = await fetch(`/api/giveaways/${id}/draw`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setWinners(data.winners ?? []);
        setGiveaway((prev: any) => ({ ...prev, status: "COMPLETED" }));
      } else {
        setError(data.error ?? "Draw failed.");
      }
    } finally {
      setDrawing(false);
    }
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

  if (!giveaway) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Giveaway Not Found</h2>
          <Link href={`/c/${slug}`}>
            <Button variant="secondary">Back to Community</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link href={`/c/${slug}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-[rgb(130,130,150)] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to {giveaway.community.name}
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {isActive && !hasEnded && <Badge variant="live">Live</Badge>}
                {isCompleted && <Badge variant="success">Completed</Badge>}
                {giveaway.status === "UPCOMING" && <Badge variant="secondary">Upcoming</Badge>}
                {giveaway.isAgentEligible && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="w-3 h-3" />
                    Agent Eligible
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{giveaway.title}</h1>
              <p className="text-xl text-purple-400 font-semibold mb-4">Prize: {giveaway.prize}</p>
              {giveaway.description && (
                <p className="text-lg text-[rgb(180,180,200)] leading-relaxed">{giveaway.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-5">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-4xl font-black text-white">{giveaway._count?.entries ?? 0}</div>
                  <div className="text-sm text-[rgb(130,130,150)]">Entries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-4xl font-black text-white">{giveaway.totalWinners}</div>
                  <div className="text-sm text-[rgb(130,130,150)]">Winners</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">
                    {isCompleted
                      ? "Ended"
                      : hasEnded
                      ? "Draw Pending"
                      : timeUntil(new Date(giveaway.endAt))}
                  </div>
                  <div className="text-sm text-[rgb(130,130,150)]">
                    {isCompleted ? format(new Date(giveaway.endAt), "MMM d") : "Remaining"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Requirements */}
            {(giveaway.requiresXFollow || giveaway.requiresDiscord) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {giveaway.requiresXFollow && (
                    <div className="flex items-center gap-2 text-base">
                      <Twitter className="w-4 h-4 text-sky-400" />
                      <span className="text-[rgb(200,200,210)]">Follow</span>
                      {giveaway.xAccountToFollow && (
                        <a
                          href={`https://twitter.com/${giveaway.xAccountToFollow}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline"
                        >
                          @{giveaway.xAccountToFollow}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Winners */}
            {isCompleted && winners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Winners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {winners.map((w: any, i: number) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-3 p-4 rounded-lg bg-[rgb(20,20,28)] border border-yellow-500/20"
                      >
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-base font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-white">
                            {w.entry?.user?.xHandle
                              ? `@${w.entry.user.xHandle}`
                              : w.entry?.user?.name ?? "Anonymous"}
                          </p>
                          {w.entry?.walletAddress && (
                            <p className="text-sm text-[rgb(130,130,150)] font-mono truncate">
                              {w.entry.walletAddress}
                            </p>
                          )}
                        </div>
                        <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Entry card */}
            {isActive && !hasEnded && !isCompleted && (
              <Card className="border-purple-500/30">
                <CardContent className="p-6">
                  {!session ? (
                    <div className="text-center">
                      <Gift className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-base text-[rgb(200,200,210)] mb-4">
                        Sign in to enter this giveaway.
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
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-base font-semibold text-white mb-2">You&apos;re entered!</p>
                      <p className="text-sm text-[rgb(130,130,150)]">Good luck! Winners drawn at the end.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold text-white">Enter Giveaway</h3>
                      <div>
                        <label className="text-sm text-[rgb(130,130,150)] mb-1.5 block">
                          Wallet Address
                        </label>
                        <Input
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder="Your SOL or BTC address"
                        />
                      </div>
                      {giveaway.requiresXFollow && (
                        <div>
                          <label className="text-sm text-[rgb(130,130,150)] mb-1.5 block">
                            X Username
                          </label>
                          <Input
                            value={xUsername}
                            onChange={(e) => setXUsername(e.target.value)}
                            placeholder="your_handle"
                          />
                        </div>
                      )}
                      {error && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
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
                            <Gift className="w-4 h-4 mr-2" />
                            Enter Giveaway
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Owner draw card */}
            {isOwner && isActive && (
              <Card className="border-orange-500/30">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-2">Owner Controls</h3>
                  <p className="text-sm text-[rgb(130,130,150)] mb-4">
                    Draw winners randomly from all entries using a Fisher-Yates shuffle.
                  </p>
                  {error && (
                    <p className="text-sm text-red-400 mb-3 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {error}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={handleDraw}
                    disabled={drawing}
                  >
                    {drawing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        Draw Winners Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardContent className="p-5 space-y-3 text-base">
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Community</span>
                  <Link href={`/c/${slug}`} className="text-purple-400 hover:underline">
                    {giveaway.community.name}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Ends</span>
                  <span className="text-white">{format(new Date(giveaway.endAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Chain</span>
                  <span className="text-white">{giveaway.community.chain}</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
