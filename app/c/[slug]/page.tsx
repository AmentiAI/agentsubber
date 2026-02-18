import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Gift,
  List,
  ShoppingBag,
  Twitter,
  MessageCircle,
  Globe,
  CheckCircle,
  Shield,
  Settings,
  ExternalLink,
  Send,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChainColor, getChainIcon, timeUntil, formatNumber } from "@/lib/utils";
import { format } from "date-fns";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!community) return { title: "Not Found" };
  return {
    title: community.name,
    description: community.description ?? undefined,
  };
}

export default async function CommunityPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  const community = await prisma.community.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      owner: { select: { id: true, name: true, xHandle: true, avatarUrl: true } },
      memberAccess: true,
      giveaways: {
        where: { status: "ACTIVE" },
        orderBy: { endAt: "asc" },
        take: 6,
        include: { _count: { select: { entries: true } } },
      },
      allowlistCampaigns: {
        where: { status: "ACTIVE" },
        orderBy: { closesAt: "asc" },
        take: 4,
      },
      presales: {
        where: { status: "ACTIVE" },
        take: 4,
      },
      _count: {
        select: {
          giveaways: true,
          allowlistCampaigns: true,
          presales: true,
        },
      },
    },
  });

  if (!community) notFound();

  const isOwner = session?.user?.id === community.ownerUserId;
  const chainColor = getChainColor(community.chain);
  const chainIcon = getChainIcon(community.chain);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Banner */}
      <div className="h-40 sm:h-56 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-[rgb(10,10,15)] relative overflow-hidden">
        {community.bannerUrl && (
          <img
            src={community.bannerUrl}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(10,10,15)] to-transparent" />
      </div>

      <main className="max-w-6xl mx-auto px-4">
        {/* Community header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-8">
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl border-4 border-[rgb(10,10,15)] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden">
              {community.logoUrl ? (
                <img src={community.logoUrl} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                community.name[0].toUpperCase()
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{community.name}</h1>
                {community.verified && (
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                )}
                <Badge variant={community.chain === "SOL" ? "sol" : "btc"}>
                  {chainIcon} {community.chain}
                </Badge>
                {community.memberAccess && community.memberAccess.gateType !== "OPEN" && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Token Gated
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-[rgb(130,130,150)]">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {formatNumber(community.memberCount)} members
                </span>
                {community.twitterHandle && (
                  <a
                    href={`https://twitter.com/${community.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" />@{community.twitterHandle}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {community.discordInvite && (
              <a href={community.discordInvite} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Discord
                </Button>
              </a>
            )}
            {community.telegramLink && (
              <a href={community.telegramLink} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Send className="w-4 h-4" />
                  Telegram
                </Button>
              </a>
            )}
            {community.websiteUrl && (
              <a href={community.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Button>
              </a>
            )}
            {isOwner && (
              <Link href={`/c/${community.slug}/manage`}>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Manage
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-[rgb(200,200,210)] mb-8 leading-relaxed max-w-2xl">
            {community.description}
          </p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={<Gift className="w-4 h-4 text-purple-400" />}
            label="Active Giveaways"
            value={community.giveaways.length}
          />
          <StatCard
            icon={<List className="w-4 h-4 text-indigo-400" />}
            label="Allowlists"
            value={community.allowlistCampaigns.length}
          />
          <StatCard
            icon={<ShoppingBag className="w-4 h-4 text-green-400" />}
            label="Presales"
            value={community.presales.length}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Giveaways */}
            {community.giveaways.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    Active Giveaways
                  </h2>
                  <Badge variant="live">Live</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {community.giveaways.map((g) => (
                    <GiveawayCard key={g.id} giveaway={g} communitySlug={community.slug} />
                  ))}
                </div>
              </section>
            )}

            {/* Allowlists */}
            {community.allowlistCampaigns.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-indigo-400" />
                    Open Allowlists
                  </h2>
                </div>
                <div className="space-y-3">
                  {community.allowlistCampaigns.map((al) => (
                    <AllowlistCard key={al.id} allowlist={al} communitySlug={community.slug} />
                  ))}
                </div>
              </section>
            )}

            {/* Presales */}
            {community.presales.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-400" />
                    Presales
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {community.presales.map((p) => (
                    <PresaleCard key={p.id} presale={p} communitySlug={community.slug} />
                  ))}
                </div>
              </section>
            )}

            {community.giveaways.length === 0 &&
              community.allowlistCampaigns.length === 0 &&
              community.presales.length === 0 && (
                <div className="text-center py-16 text-[rgb(130,130,150)]">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No active campaigns right now. Check back soon!</p>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Chain</span>
                  <span className={`font-semibold ${chainColor}`}>
                    {chainIcon} {community.chain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Access</span>
                  <span className="text-white">
                    {community.memberAccess?.gateType === "OPEN" ? "Open" : "Gated"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Owner</span>
                  <span className="text-white">
                    {community.owner.xHandle
                      ? `@${community.owner.xHandle}`
                      : community.owner.name}
                  </span>
                </div>
              </CardContent>
            </Card>

            {!session && (
              <Card className="border-purple-500/30 bg-purple-600/10">
                <CardContent className="p-4">
                  <p className="text-sm text-[rgb(200,200,210)] mb-3">
                    Connect your X account and wallet to enter giveaways and join allowlists.
                  </p>
                  <Link href="/login">
                    <Button variant="gradient" className="w-full gap-2" size="sm">
                      <Twitter className="w-4 h-4" />
                      Connect with X
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
      <div className="h-20" />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgb(30,30,40)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{value}</div>
          <div className="text-xs text-[rgb(130,130,150)]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GiveawayCard({ giveaway, communitySlug }: { giveaway: any; communitySlug: string }) {
  return (
    <Link href={`/c/${communitySlug}/giveaways/${giveaway.id}`}>
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-white leading-tight">{giveaway.title}</h3>
            <Badge variant="live" className="shrink-0 ml-2">Live</Badge>
          </div>
          <p className="text-xs text-purple-400 font-medium mb-3">Prize: {giveaway.prize}</p>
          <div className="flex items-center justify-between text-xs text-[rgb(130,130,150)]">
            <span>{giveaway._count.entries} entries</span>
            <span>{giveaway.totalWinners} winner{giveaway.totalWinners !== 1 ? "s" : ""}</span>
            <span className="text-yellow-400">⏱ {timeUntil(new Date(giveaway.endAt))}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AllowlistCard({ allowlist, communitySlug }: { allowlist: any; communitySlug: string }) {
  const pct = Math.round((allowlist.filledSpots / allowlist.totalSpots) * 100);
  return (
    <Link href={`/c/${communitySlug}/allowlist/${allowlist.id}`}>
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">{allowlist.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {allowlist.entryMethod}
            </Badge>
          </div>
          <div className="mb-1">
            <div className="flex justify-between text-xs text-[rgb(130,130,150)] mb-1">
              <span>{allowlist.filledSpots} / {allowlist.totalSpots} spots</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[rgb(30,30,40)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
          {allowlist.closesAt && (
            <div className="text-xs text-[rgb(130,130,150)] mt-2">
              Closes {timeUntil(new Date(allowlist.closesAt))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function PresaleCard({ presale, communitySlug }: { presale: any; communitySlug: string }) {
  const soldPct = Math.round((presale.soldCount / presale.totalSupply) * 100);
  return (
    <Link href={`/c/${communitySlug}/presale/${presale.id}`}>
      <Card className="card-hover">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-1">{presale.name}</h3>
          <div className="text-xs text-green-400 font-medium mb-2">
            {presale.priceSOL ? `${presale.priceSOL} SOL` : ""}
            {presale.priceBTC ? `${presale.priceBTC} BTC` : ""}
          </div>
          <div className="flex justify-between text-xs text-[rgb(130,130,150)]">
            <span>{presale.soldCount} / {presale.totalSupply} sold</span>
            <span>{soldPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[rgb(30,30,40)] mt-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600"
              style={{ width: `${Math.min(soldPct, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
