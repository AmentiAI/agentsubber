"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Gift,
  List,
  Settings,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getChainColor, getChainIcon, formatNumber } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  chain: string;
  memberCount: number;
  verified: boolean;
  _count: { giveaways: number; allowlistCampaigns: number };
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/communities/mine")
      .then((r) => r.json())
      .then((data) => setCommunities(data.communities ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">My Communities</h1>
              </div>
              <Link href="/dashboard/communities/new">
                <Button variant="gradient" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Community
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : communities.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[rgb(130,130,150)]" />
                </div>
                <h3 className="text-white font-semibold mb-2">No communities yet</h3>
                <p className="text-[rgb(130,130,150)] text-sm mb-4">
                  Create your first Web3 community to start running giveaways and allowlists.
                </p>
                <Link href="/dashboard/communities/new">
                  <Button variant="gradient" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Community
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((c) => (
                  <Card key={c.id} className="card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {c.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-white text-sm">{c.name}</span>
                              {c.verified && (
                                <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                              )}
                            </div>
                            <span className={`text-xs font-medium ${getChainColor(c.chain)}`}>
                              {getChainIcon(c.chain)} {c.chain}
                            </span>
                          </div>
                        </div>
                      </div>

                      {c.description && (
                        <p className="text-xs text-[rgb(130,130,150)] mb-3 line-clamp-2">
                          {c.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-[rgb(130,130,150)] mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatNumber(c.memberCount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {c._count.giveaways}
                        </div>
                        <div className="flex items-center gap-1">
                          <List className="w-3 h-3" />
                          {c._count.allowlistCampaigns}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/c/${c.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                        <Link href={`/c/${c.slug}/manage`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full gap-1">
                            <Settings className="w-3.5 h-3.5" />
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
