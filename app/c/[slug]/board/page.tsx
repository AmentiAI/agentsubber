"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import FeedView from "@/components/feed/FeedView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Loader2, LayoutGrid, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function CommunityBoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch(`/api/communities?slug=${slug}`);
        const d1 = await r1.json();
        const found = d1.communities?.find((c: any) => c.slug === slug);
        if (!found) return;
        const r2 = await fetch(`/api/communities/${found.id}`);
        const d2 = await r2.json();
        setCommunity(d2.community);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center py-32 text-[rgb(130,130,150)]">Community not found.</div>
      </div>
    );
  }

  const accent = community.accentColor ?? "#8B5CF6";
  const communityForFeed = {
    id: community.id,
    name: community.name,
    slug: community.slug,
    logoUrl: community.logoUrl ?? null,
    logoPosition: community.logoPosition ?? null,
    accentColor: community.accentColor ?? null,
  };

  return (
    <div className="min-h-screen bg-[rgb(10,10,15)]">
      <Navbar />

      {/* ── Community header bar ── */}
      <div className="border-b border-[rgb(30,30,40)] bg-[rgb(12,12,18)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/c/${slug}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[rgb(130,130,150)]">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="w-px h-5 bg-[rgb(35,35,50)]" />
          {/* Logo */}
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold"
          >
            {community.logoUrl ? (
              <img
                src={community.logoUrl}
                alt={community.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: community.logoPosition ?? "50% 50%" }}
              />
            ) : (
              community.name[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base truncate">{community.name}</span>
              <Badge variant={community.chain === "SOL" ? "sol" : "btc"} className="text-xs">{community.chain}</Badge>
            </div>
            <p className="text-xs text-[rgb(100,100,120)] flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3" />
              {community.memberCount ?? 0} members
            </p>
          </div>

          {/* Page tabs */}
          <div className="flex items-center gap-1 p-1 bg-[rgb(18,18,26)] rounded-xl border border-[rgb(35,35,50)]">
            <Link href={`/c/${slug}`}>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(30,30,42)] transition-colors">
                <LayoutGrid className="w-3.5 h-3.5" />
                Overview
              </button>
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white">
              <MessageSquare className="w-3.5 h-3.5" />
              Board
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Feed — 2/3 */}
          <div className="lg:col-span-2">
            <FeedView
              communitySlug={slug}
              communityId={community.id}
              community={communityForFeed}
              hideCommunityBadge
            />
          </div>

          {/* Sidebar — 1/3 */}
          <aside className="space-y-5 hidden lg:block">
            {/* About this community */}
            <div className="p-5 rounded-2xl border border-[rgb(35,35,50)] bg-[rgb(14,14,20)] space-y-4">
              <h3 className="text-sm font-bold text-white">About</h3>
              {community.description && (
                <p className="text-sm text-[rgb(170,170,190)] leading-relaxed">{community.description}</p>
              )}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[rgb(110,110,130)]">Chain</span>
                  <span className="font-semibold" style={{ color: accent }}>{community.chain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(110,110,130)]">Members</span>
                  <span className="text-white font-semibold">{community.memberCount ?? 0}</span>
                </div>
                {community.mintPrice && (
                  <div className="flex justify-between">
                    <span className="text-[rgb(110,110,130)]">Mint Price</span>
                    <span className="text-white font-semibold">{community.mintPrice}</span>
                  </div>
                )}
                {community.totalSupply != null && (
                  <div className="flex justify-between">
                    <span className="text-[rgb(110,110,130)]">Supply</span>
                    <span className="text-white font-semibold">{community.totalSupply.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <Link href={`/c/${slug}`}>
                <Button variant="secondary" size="sm" className="w-full mt-2 gap-2">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  View Community Page
                </Button>
              </Link>
            </div>

            {/* Community rules (placeholder) */}
            <div className="p-5 rounded-2xl border border-[rgb(35,35,50)] bg-[rgb(14,14,20)]">
              <h3 className="text-sm font-bold text-white mb-3">Board Rules</h3>
              <ul className="space-y-2 text-sm text-[rgb(150,150,170)]">
                <li className="flex items-start gap-2"><span style={{ color: accent }}>1.</span> Keep it relevant to the community</li>
                <li className="flex items-start gap-2"><span style={{ color: accent }}>2.</span> Be respectful to all members</li>
                <li className="flex items-start gap-2"><span style={{ color: accent }}>3.</span> No spam or self-promotion</li>
                <li className="flex items-start gap-2"><span style={{ color: accent }}>4.</span> Share your art, updates & news</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
