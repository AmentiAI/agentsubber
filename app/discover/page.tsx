"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Gift,
  Shield,
  ExternalLink,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getChainColor, getChainIcon } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  chain: string;
  memberCount: number;
  verified: boolean;
  twitterHandle: string | null;
  memberAccess?: { gateType: string };
  _count?: { giveaways: number };
}

const CHAIN_FILTERS = [
  { label: "All", value: "" },
  { label: "◎ Solana", value: "SOL" },
  { label: "₿ Bitcoin", value: "BTC" },
];

export default function DiscoverPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (chainFilter) params.set("chain", chainFilter);
    setLoading(true);
    fetch(`/api/communities?${params}`)
      .then((r) => r.json())
      .then((data) => setCommunities(data.communities ?? []))
      .finally(() => setLoading(false));
  }, [search, chainFilter]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Communities</h1>
          <p className="text-[rgb(130,130,150)]">
            Find Web3 communities, join giveaways, and secure allowlist spots.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(130,130,150)]" />
            <Input
              placeholder="Search communities..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {CHAIN_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={chainFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChainFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[rgb(130,130,150)]" />
            </div>
            <h3 className="text-white font-semibold mb-2">No communities found</h3>
            <p className="text-[rgb(130,130,150)] text-sm mb-4">
              {search ? "Try a different search term." : "Be the first to create a community!"}
            </p>
            <Link href="/dashboard/communities/new">
              <Button variant="gradient">Create Community</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CommunityCard({ community: c }: { community: Community }) {
  const chainColor = getChainColor(c.chain);
  const chainIcon = getChainIcon(c.chain);

  return (
    <Link href={`/c/${c.slug}`}>
      <Card className="card-hover overflow-hidden h-full">
        {/* Banner / Logo area */}
        <div className="h-24 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 relative">
          {c.logoUrl && (
            <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[rgb(16,16,22)] to-transparent" />
        </div>

        <CardContent className="p-4 -mt-6 relative">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl border-2 border-[rgb(16,16,22)] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-3">
            {c.logoUrl ? (
              <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              c.name[0].toUpperCase()
            )}
          </div>

          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-white text-sm leading-none">{c.name}</h3>
                {c.verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                )}
              </div>
              {c.twitterHandle && (
                <div className="text-xs text-[rgb(130,130,150)] mt-0.5">
                  @{c.twitterHandle}
                </div>
              )}
            </div>
            <span className={`text-sm font-bold ${chainColor}`}>{chainIcon}</span>
          </div>

          {c.description && (
            <p className="text-xs text-[rgb(130,130,150)] leading-relaxed mb-3 line-clamp-2">
              {c.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[rgb(130,130,150)]">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {c.memberCount.toLocaleString()}
              </div>
              {c._count?.giveaways !== undefined && (
                <div className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {c._count.giveaways}
                </div>
              )}
            </div>
            {c.memberAccess?.gateType !== "OPEN" && (
              <Badge variant="secondary" className="text-xs py-0 gap-1">
                <Shield className="w-3 h-3" />
                Gated
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
