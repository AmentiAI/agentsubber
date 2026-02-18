"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Loader2, Clock, Users } from "lucide-react";
import Link from "next/link";
import { timeUntil } from "@/lib/utils";

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/giveaways?status=ACTIVE")
      .then((r) => r.json())
      .then((data) => setGiveaways(data.giveaways ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-8">
              <Gift className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Active Giveaways</h1>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : giveaways.length === 0 ? (
              <div className="text-center py-20">
                <Gift className="w-12 h-12 text-[rgb(130,130,150)] mx-auto mb-4 opacity-40" />
                <h3 className="text-white font-semibold mb-2">No active giveaways</h3>
                <p className="text-[rgb(130,130,150)] text-sm">
                  Check the <Link href="/discover" className="text-purple-400 hover:underline">Discover</Link> page to find communities running giveaways.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {giveaways.map((g) => (
                  <Link
                    key={g.id}
                    href={`/c/${g.community.slug}/giveaways/${g.id}`}
                  >
                    <Card className="card-hover h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                              {g.community.logoUrl ? (
                                <img src={g.community.logoUrl} alt={g.community.name} className="w-full h-full object-cover" />
                              ) : (
                                g.community.name[0].toUpperCase()
                              )}
                            </div>
                            <span className="text-xs text-[rgb(130,130,150)]">{g.community.name}</span>
                          </div>
                          <Badge variant="live">Live</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{g.title}</h3>
                        <p className="text-xs text-purple-400 font-medium mb-3">
                          Prize: {g.prize}
                        </p>
                        <div className="flex items-center justify-between text-xs text-[rgb(130,130,150)]">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {g._count.entries} entries
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            {g.totalWinners} winner{g.totalWinners !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Clock className="w-3 h-3" />
                            {timeUntil(new Date(g.endAt))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
