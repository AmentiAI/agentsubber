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
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-10">
              <Gift className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl sm:text-4xl font-black text-white">Active Giveaways</h1>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : giveaways.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-5">
                  <Gift className="w-10 h-10 text-[rgb(130,130,150)] opacity-60" />
                </div>
                <h3 className="text-xl text-white font-bold mb-2">No active giveaways</h3>
                <p className="text-[rgb(130,130,150)] text-base">
                  Check the <Link href="/discover" className="text-purple-400 hover:underline">Discover</Link> page to find communities running giveaways.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {giveaways.map((g) => (
                  <Link
                    key={g.id}
                    href={`/c/${g.community.slug}/giveaways/${g.id}`}
                  >
                    <Card className="card-hover h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                              {g.community.logoUrl ? (
                                <img src={g.community.logoUrl} alt={g.community.name} className="w-full h-full object-cover" />
                              ) : (
                                g.community.name[0].toUpperCase()
                              )}
                            </div>
                            <span className="text-sm text-[rgb(130,130,150)]">{g.community.name}</span>
                          </div>
                          <Badge variant="live">Live</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{g.title}</h3>
                        <p className="text-base text-purple-400 font-medium mb-4">
                          🏆 {g.prize}
                        </p>
                        <div className="flex items-center justify-between text-sm text-[rgb(130,130,150)]">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {g._count?.entries ?? 0} entries
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            {g.totalWinners} winner{g.totalWinners !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Clock className="w-4 h-4" />
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
