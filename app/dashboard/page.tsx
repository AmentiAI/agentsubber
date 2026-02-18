"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Gift,
  List,
  Bot,
  Plus,
  ArrowRight,
  Wallet,
  Trophy,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

interface DashboardStats {
  communities: number;
  activeGiveaways: number;
  allowlistEntries: number;
  agentRegistered: boolean;
  wallets: number;
  wins: number;
}

const QUICK_ACTIONS = [
  { icon: Users, label: "Create Community", description: "Launch your Web3 project", href: "/dashboard/communities/new", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: Gift, label: "Create Giveaway", description: "Run a fair raffle", href: "/dashboard/giveaways/new", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { icon: List, label: "New Allowlist", description: "Collect wallet addresses", href: "/dashboard/allowlists/new", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { icon: Bot, label: "Setup Agent", description: "Register your OpenClaw agent", href: "/dashboard/agent", color: "text-pink-400", bg: "bg-pink-400/10" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user as any;
  const displayName = user?.xHandle ? `@${user.xHandle}` : user?.name ?? "there";
  const plan = user?.plan ?? "FREE";

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(10,10,15)]">
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)]">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-24 lg:pb-10 space-y-8">

          {/* Welcome */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">Welcome back, {displayName} 👋</h1>
              <p className="text-xl text-[rgb(140,140,165)]">Here&apos;s what&apos;s happening with your communities.</p>
            </div>
            <Badge variant={plan === "FREE" ? "secondary" : "default"} className="gap-1.5 text-sm px-4 py-1.5 mt-2">
              {plan === "ELITE" && "⚡"}{plan} Plan
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            <StatCard icon={<Users className="w-7 h-7 text-purple-400" />} label="Communities" value={stats?.communities ?? 0} loading={loading} />
            <StatCard icon={<Gift className="w-7 h-7 text-indigo-400" />} label="Active Giveaways" value={stats?.activeGiveaways ?? 0} loading={loading} />
            <StatCard icon={<List className="w-7 h-7 text-cyan-400" />} label="AL Entries" value={stats?.allowlistEntries ?? 0} loading={loading} />
            <StatCard icon={<Trophy className="w-7 h-7 text-yellow-400" />} label="Giveaway Wins" value={stats?.wins ?? 0} loading={loading} />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-black text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <Card className="card-hover cursor-pointer h-full">
                      <CardContent className="p-8">
                        <div className={`w-16 h-16 rounded-2xl ${action.bg} flex items-center justify-center mb-5`}>
                          <Icon className={`w-8 h-8 ${action.color}`} />
                        </div>
                        <div className="text-xl font-bold text-white mb-2">{action.label}</div>
                        <div className="text-base text-[rgb(130,130,150)]">{action.description}</div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Agent + Wallet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Bot className="w-6 h-6 text-purple-400" />OpenClaw Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 pb-7">
                {stats?.agentRegistered ? (
                  <div className="flex items-center gap-5">
                    <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-white">Agent registered</div>
                      <div className="text-base text-[rgb(130,130,150)]">Active and entering giveaways on your behalf.</div>
                    </div>
                    <Link href="/dashboard/agent"><Button variant="ghost" size="lg">Manage</Button></Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[rgb(25,25,38)] flex items-center justify-center shrink-0">
                      <Bot className="w-7 h-7 text-[rgb(100,100,120)]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-white">No agent yet</div>
                      <div className="text-base text-[rgb(130,130,150)]">Register to auto-enter giveaways.</div>
                    </div>
                    <Link href="/dashboard/agent"><Button variant="gradient" size="lg" className="gap-2"><Plus className="w-4 h-4" />Register</Button></Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Wallet className="w-6 h-6 text-purple-400" />Connected Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 pb-7">
                {(stats?.wallets ?? 0) > 0 ? (
                  <div className="flex items-center gap-5">
                    <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-white">{stats?.wallets} wallet{stats?.wallets !== 1 ? "s" : ""} connected</div>
                      <div className="text-base text-[rgb(130,130,150)]">Linked and ready to use.</div>
                    </div>
                    <Link href="/dashboard/wallets"><Button variant="ghost" size="lg">Manage</Button></Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[rgb(25,25,38)] flex items-center justify-center shrink-0">
                      <Wallet className="w-7 h-7 text-[rgb(100,100,120)]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-white">No wallets</div>
                      <div className="text-base text-[rgb(130,130,150)]">Connect a SOL or BTC wallet to enter giveaways.</div>
                    </div>
                    <Link href="/dashboard/wallets"><Button variant="gradient" size="lg" className="gap-2"><Plus className="w-4 h-4" />Connect</Button></Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upgrade */}
          {plan === "FREE" && (
            <div className="p-8 rounded-2xl border border-purple-500/30 bg-purple-600/10 flex items-center gap-6">
              <TrendingUp className="w-12 h-12 text-purple-400 shrink-0" />
              <div className="flex-1">
                <div className="text-2xl font-black text-white mb-1">Unlock more with Pro</div>
                <div className="text-lg text-[rgb(150,150,175)]">Get 5 communities, unlimited giveaways, collabs, presales, and 2x giveaway multiplier.</div>
              </div>
              <Link href="/dashboard/subscription">
                <Button variant="gradient" size="lg" className="gap-2 shrink-0 text-base px-8">Upgrade <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <span className="text-base text-[rgb(140,140,165)] font-medium">{label}</span>
        </div>
        <div className="text-6xl font-black text-white">
          {loading ? <div className="w-20 h-14 rounded shimmer" /> : formatNumber(value)}
        </div>
      </CardContent>
    </Card>
  );
}
