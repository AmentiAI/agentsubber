"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { timeUntil } from "@/lib/utils";

export default function AllowlistsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/allowlists?status=ACTIVE")
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns ?? []))
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
              <List className="w-8 h-8 text-indigo-400" />
              <h1 className="text-4xl font-black text-white">Open Allowlists</h1>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-5">
                  <List className="w-10 h-10 text-[rgb(130,130,150)] opacity-60" />
                </div>
                <h3 className="text-xl text-white font-bold mb-2">No open allowlists</h3>
                <p className="text-[rgb(130,130,150)] text-base">
                  Check the{" "}
                  <Link href="/discover" className="text-purple-400 hover:underline">
                    Discover
                  </Link>{" "}
                  page to find communities with open allowlists.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((a) => {
                  const pct = Math.round((a.filledSpots / a.totalSpots) * 100);
                  return (
                    <Link
                      key={a.id}
                      href={`/c/${a.community.slug}/allowlist/${a.id}`}
                    >
                      <Card className="card-hover">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {a.community.name[0].toUpperCase()}
                                  </div>
                                  <span className="text-sm text-[rgb(130,130,150)]">{a.community.name}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">{a.entryMethod}</Badge>
                              </div>
                              <h3 className="text-base font-semibold text-white mb-3">{a.name}</h3>
                              <div className="flex items-center justify-between mb-1.5 text-sm text-[rgb(130,130,150)]">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {a.filledSpots} / {a.totalSpots} spots
                                </span>
                                {a.closesAt && (
                                  <span>Closes {timeUntil(new Date(a.closesAt))}</span>
                                )}
                              </div>
                              <div className="w-full h-2 rounded-full bg-[rgb(30,30,40)]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                            <Badge variant="live" className="shrink-0">Open</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
