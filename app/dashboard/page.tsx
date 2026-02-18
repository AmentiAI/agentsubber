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
  Clock,
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
  {
    icon: Users,
    label: "Create Community",
    description: "Launch your Web3 project",
    href: "/dashboard/communities/new",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Gift,
    label: "Create Giveaway",
    description: "Run a fair raffle",
    href: "/dashboard/giveaways/new",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    icon: List,
    label: "New Allowlist",
    description: "Collect wallet addresses",
    href: "/dashboard/allowlists/new",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Bot,
    label: "Setup Agent",
    description: "Register your OpenClaw agent",
    href: "/dashboard/agent",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            {/* Welcome */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Welcome back, {displayName} 👋
                </h1>
                <p className="text-base text-[rgb(130,130,150)]">
                  Here&apos;s what&apos;s happening with your communities.
                </p>
              </div>
              <Badge variant={plan === "FREE" ? "secondary" : "default"} className="gap-1">
                {plan === "ELITE" && "⚡"}
                {plan} Plan
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              <StatCard
                icon={<Users className="w-6 h-6 text-purple-400" />}
                label="Communities"
                value={stats?.communities ?? 0}
                loading={loading}
              />
              <StatCard
                icon={<Gift className="w-6 h-6 text-indigo-400" />}
                label="Active Giveaways"
                value={stats?.activeGiveaways ?? 0}
                loading={loading}
              />
              <StatCard
                icon={<List className="w-6 h-6 text-cyan-400" />}
                label="AL Entries"
                value={stats?.allowlistEntries ?? 0}
                loading={loading}
              />
              <StatCard
                icon={<Trophy className="w-6 h-6 text-yellow-400" />}
                label="Giveaway Wins"
                value={stats?.wins ?? 0}
                loading={loading}
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-5">Quick Actions</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}>
                      <Card className="card-hover cursor-pointer">
                        <CardContent className="p-6">
                          <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center mb-4`}>
                            <Icon className={`w-7 h-7 ${action.color}`} />
                          </div>
                          <div className="font-bold text-white text-base mb-1">
                            {action.label}
                          </div>
                          <div className="text-sm text-[rgb(130,130,150)]">
                            {action.description}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Agent status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="w-5 h-5 text-purple-400" />
                    OpenClaw Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {stats?.agentRegistered ? (
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                      <div>
                        <div className="text-base font-semibold text-white">Agent registered</div>
                        <div className="text-sm text-[rgb(130,130,150)]">
                          Your agent is active and can enter giveaways on your behalf.
                        </div>
                      </div>
                      <Link href="/dashboard/agent" className="ml-auto">
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[rgb(30,30,40)] flex items-center justify-center shrink-0">
                        <Bot className="w-6 h-6 text-[rgb(130,130,150)]" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white">No agent yet</div>
                        <div className="text-sm text-[rgb(130,130,150)]">
                          Register your OpenClaw agent to auto-enter giveaways.
                        </div>
                      </div>
                      <Link href="/dashboard/agent" className="ml-auto">
                        <Button variant="gradient" size="sm" className="gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          Register
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="w-5 h-5 text-purple-400" />
                    Connected Wallets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {(stats?.wallets ?? 0) > 0 ? (
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                      <div>
                        <div className="text-base font-semibold text-white">
                          {stats?.wallets} wallet{(stats?.wallets ?? 0) !== 1 ? "s" : ""} connected
                        </div>
                        <div className="text-sm text-[rgb(130,130,150)]">
                          Your wallets are linked and ready to use.
                        </div>
                      </div>
                      <Link href="/dashboard/wallets" className="ml-auto">
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[rgb(30,30,40)] flex items-center justify-center shrink-0">
                        <Wallet className="w-6 h-6 text-[rgb(130,130,150)]" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white">No wallets</div>
                        <div className="text-sm text-[rgb(130,130,150)]">
                          Connect a Solana or Bitcoin wallet to enter giveaways.
                        </div>
                      </div>
                      <Link href="/dashboard/wallets" className="ml-auto">
                        <Button variant="gradient" size="sm" className="gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          Connect
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upgrade prompt for free users */}
            {plan === "FREE" && (
              <div className="mt-6 p-6 rounded-xl border border-purple-500/30 bg-purple-600/10 flex items-center gap-5">
                <TrendingUp className="w-10 h-10 text-purple-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-lg font-bold text-white mb-1">Unlock more with Pro</div>
                  <div className="text-base text-[rgb(130,130,150)]">
                    Get 5 communities, unlimited giveaways, collabs, presales, and 2x giveaway multiplier.
                  </div>
                </div>
                <Link href="/dashboard/subscription">
                  <Button variant="gradient" size="sm" className="gap-1 shrink-0">
                    Upgrade
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-3">
          {icon}
          <span className="text-sm text-[rgb(130,130,150)]">{label}</span>
        </div>
        <div className="text-4xl font-black text-white">
          {loading ? (
            <div className="w-16 h-10 rounded shimmer" />
          ) : (
            formatNumber(value)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
