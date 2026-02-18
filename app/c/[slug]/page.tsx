import { notFound } from "next/navigation";
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
  Send,
  Instagram,
  Youtube,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChainColor, getChainIcon, timeUntil, formatNumber } from "@/lib/utils";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCommunityData(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://agentsubber.vercel.app";
  const res = await fetch(`${baseUrl}/api/communities?slug=${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const community = data.communities?.find((c: any) => c.slug === slug);
  if (!community) return null;

  const detailedRes = await fetch(`${baseUrl}/api/communities/${community.id}`, {
    cache: "no-store",
  });
  if (!detailedRes.ok) return null;
  const detailed = await detailedRes.json();
  return detailed.community ?? null;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const community = await getCommunityData(slug);
    if (!community) return { title: "Not Found" };
    return {
      title: community.name,
      description: community.description ?? undefined,
    };
  } catch {
    return { title: "Community" };
  }
}

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  let community: any;
  try {
    community = await getCommunityData(slug);
  } catch {
    notFound();
  }

  if (!community) notFound();

  const isOwner = session?.user?.id === community.ownerUserId;
  const chainColor = getChainColor(community.chain);
  const chainIcon = getChainIcon(community.chain);

  const tagList: string[] = community.tags
    ? community.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const activeGiveaways = (community.giveaways ?? []).filter((g: any) => g.status === "ACTIVE").slice(0, 6);
  const activeAllowlists = (community.allowlistCampaigns ?? []).filter((a: any) => a.status === "ACTIVE").slice(0, 4);
  const activePresales = (community.presales ?? []).filter((p: any) => p.status === "ACTIVE").slice(0, 4);

  const hasCollectionStats = community.mintDate || community.mintPrice || community.totalSupply != null;
  const accent = community.accentColor ?? "#8B5CF6";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Announcement Banner ── */}
      {community.announcementText && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div
            className="border-l-4 bg-purple-900/20 p-4 mb-2 rounded-r-xl"
            style={{ borderColor: accent }}
          >
            <p className="text-white font-medium">{community.announcementText}</p>
          </div>
        </div>
      )}

      {/* ── Banner ── */}
      <div className="h-56 sm:h-72 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-[rgb(10,10,15)] relative overflow-hidden">
        {community.bannerUrl && (
          <img
            src={community.bannerUrl}
            alt=""
            className="w-full h-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(10,10,15)] to-transparent" />
      </div>

      <main className="max-w-6xl mx-auto px-4">
        {/* ── Community Header ── */}
        <div className="-mt-16 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <div
                className="w-28 h-28 rounded-2xl border-4 border-[rgb(10,10,15)] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shrink-0 overflow-hidden"
                style={{ borderColor: "rgb(10,10,15)" }}
              >
                {community.logoUrl ? (
                  <img src={community.logoUrl} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  community.name[0].toUpperCase()
                )}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-4xl font-black text-white">{community.name}</h1>
                  {community.verified && (
                    <CheckCircle className="w-6 h-6 text-purple-400 shrink-0" />
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

                {/* Tags */}
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tagList.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Social links row */}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {community.twitterHandle && (
                    <a
                      href={`https://twitter.com/${community.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title={`@${community.twitterHandle}`}
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {community.discordInvite && (
                    <a
                      href={community.discordInvite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="Discord"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                  {community.telegramLink && (
                    <a
                      href={community.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="Telegram"
                    >
                      <Send className="w-4 h-4" />
                    </a>
                  )}
                  {community.websiteUrl && (
                    <a
                      href={community.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {community.instagramUrl && (
                    <a
                      href={community.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {community.youtubeUrl && (
                    <a
                      href={community.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  {community.magicEdenUrl && (
                    <a
                      href={community.magicEdenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="Magic Eden"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {community.tensorUrl && (
                    <a
                      href={community.tensorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(25,25,35)] hover:bg-[rgb(35,35,50)] text-[rgb(130,130,150)] hover:text-white transition-colors"
                      title="Tensor"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link href={`/c/${community.slug}/manage`}>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Manage
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Collection Stats Bar ── */}
        {hasCollectionStats && (
          <div className="grid grid-cols-3 gap-4 py-5 px-6 bg-[rgb(20,20,28)] rounded-2xl border border-[rgb(40,40,55)] mb-8">
            <div>
              <div
                className="text-2xl font-black text-white"
                style={{ color: accent }}
              >
                {community.totalSupply != null ? community.totalSupply.toLocaleString() : "—"}
              </div>
              <div className="text-sm text-[rgb(130,130,150)]">Total Supply</div>
            </div>
            <div>
              <div
                className="text-2xl font-black text-white"
                style={{ color: accent }}
              >
                {community.mintPrice ?? "—"}
              </div>
              <div className="text-sm text-[rgb(130,130,150)]">Mint Price</div>
            </div>
            <div>
              <div
                className="text-2xl font-black text-white"
                style={{ color: accent }}
              >
                {community.mintDate ?? "—"}
              </div>
              <div className="text-sm text-[rgb(130,130,150)]">Mint Date</div>
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {community.description && (
          <p className="text-lg text-[rgb(200,200,210)] leading-relaxed mb-8">
            {community.description}
          </p>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={<Gift className="w-5 h-5 text-purple-400" />}
            label="Active Giveaways"
            value={activeGiveaways.length}
            accent={accent}
          />
          <StatCard
            icon={<List className="w-5 h-5 text-indigo-400" />}
            label="Open Allowlists"
            value={activeAllowlists.length}
            accent={accent}
          />
          <StatCard
            icon={<ShoppingBag className="w-5 h-5 text-green-400" />}
            label="Presales"
            value={activePresales.length}
            accent={accent}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-400" />}
            label="Members"
            value={formatNumber(community.memberCount)}
            accent={accent}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Giveaways */}
            {activeGiveaways.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    Active Giveaways
                  </h2>
                  <Badge variant="live">Live</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {activeGiveaways.map((g: any) => (
                    <GiveawayCard key={g.id} giveaway={g} communitySlug={community.slug} accent={accent} />
                  ))}
                </div>
              </section>
            )}

            {/* Allowlists */}
            {activeAllowlists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-indigo-400" />
                    Open Allowlists
                  </h2>
                </div>
                <div className="space-y-4">
                  {activeAllowlists.map((al: any) => (
                    <AllowlistCard key={al.id} allowlist={al} communitySlug={community.slug} accent={accent} />
                  ))}
                </div>
              </section>
            )}

            {/* Presales */}
            {activePresales.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-400" />
                    Presales
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {activePresales.map((p: any) => (
                    <PresaleCard key={p.id} presale={p} communitySlug={community.slug} />
                  ))}
                </div>
              </section>
            )}

            {activeGiveaways.length === 0 &&
              activeAllowlists.length === 0 &&
              activePresales.length === 0 && (
                <div className="text-center py-16 text-[rgb(130,130,150)]">
                  <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No active campaigns right now. Check back soon!</p>
                </div>
              )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            {/* About Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
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
                    {community.owner?.xHandle
                      ? `@${community.owner.xHandle}`
                      : community.owner?.name ?? "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Members</span>
                  <span className="text-white">{formatNumber(community.memberCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(130,130,150)]">Created</span>
                  <span className="text-white">
                    {format(new Date(community.createdAt), "MMM yyyy")}
                  </span>
                </div>

                {/* Social links in sidebar */}
                {(community.twitterHandle ||
                  community.discordInvite ||
                  community.telegramLink ||
                  community.websiteUrl ||
                  community.instagramUrl ||
                  community.youtubeUrl ||
                  community.magicEdenUrl ||
                  community.tensorUrl) && (
                  <div className="pt-2 border-t border-[rgb(40,40,55)] space-y-2">
                    {community.twitterHandle && (
                      <a
                        href={`https://twitter.com/${community.twitterHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <Twitter className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">@{community.twitterHandle}</span>
                      </a>
                    )}
                    {community.discordInvite && (
                      <a
                        href={community.discordInvite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">Discord</span>
                      </a>
                    )}
                    {community.telegramLink && (
                      <a
                        href={community.telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">Telegram</span>
                      </a>
                    )}
                    {community.websiteUrl && (
                      <a
                        href={community.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">Website</span>
                      </a>
                    )}
                    {community.instagramUrl && (
                      <a
                        href={community.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">Instagram</span>
                      </a>
                    )}
                    {community.youtubeUrl && (
                      <a
                        href={community.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">YouTube</span>
                      </a>
                    )}
                    {community.magicEdenUrl && (
                      <a
                        href={community.magicEdenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">Magic Eden</span>
                      </a>
                    )}
                    {community.tensorUrl && (
                      <a
                        href={community.tensorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[rgb(130,130,150)] hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">Tensor</span>
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connect Card */}
            {!session && (
              <Card className="border-purple-500/30 bg-purple-600/10">
                <CardContent className="p-5">
                  <p className="text-sm text-[rgb(200,200,210)] mb-4">
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

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgb(30,30,40)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-black text-white">{value}</div>
          <div className="text-xs text-[rgb(130,130,150)]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GiveawayCard({
  giveaway,
  communitySlug,
  accent,
}: {
  giveaway: any;
  communitySlug: string;
  accent?: string;
}) {
  return (
    <Link href={`/c/${communitySlug}/giveaways/${giveaway.id}`}>
      <Card className="card-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-white leading-tight">{giveaway.title}</h3>
            <Badge variant="live" className="shrink-0 ml-2">Live</Badge>
          </div>
          <p className="text-sm font-medium mb-3" style={{ color: accent ?? "#a78bfa" }}>
            Prize: {giveaway.prize}
          </p>
          <div className="flex items-center justify-between text-sm text-[rgb(130,130,150)]">
            <span>{giveaway._count?.entries ?? 0} entries</span>
            <span>{giveaway.totalWinners} winner{giveaway.totalWinners !== 1 ? "s" : ""}</span>
            <span className="text-yellow-400">⏱ {timeUntil(new Date(giveaway.endAt))}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AllowlistCard({
  allowlist,
  communitySlug,
  accent,
}: {
  allowlist: any;
  communitySlug: string;
  accent?: string;
}) {
  const pct = Math.round((allowlist.filledSpots / allowlist.totalSpots) * 100);
  return (
    <Link href={`/c/${communitySlug}/allowlist/${allowlist.id}`}>
      <Card className="card-hover">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">{allowlist.name}</h3>
            <Badge variant="secondary" className="text-sm">
              {allowlist.entryMethod}
            </Badge>
          </div>
          <div className="mb-1">
            <div className="flex justify-between text-sm text-[rgb(130,130,150)] mb-1">
              <span>{allowlist.filledSpots} / {allowlist.totalSpots} spots</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[rgb(30,30,40)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: `linear-gradient(to right, ${accent ?? "#7c3aed"}, ${accent ? accent + "bb" : "#4f46e5"})`,
                }}
              />
            </div>
          </div>
          {allowlist.closesAt && (
            <div className="text-sm text-[rgb(130,130,150)] mt-2">
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
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-white mb-1">{presale.name}</h3>
          <div className="text-sm text-green-400 font-medium mb-3">
            {presale.priceSOL ? `${presale.priceSOL} SOL` : ""}
            {presale.priceBTC ? `${presale.priceBTC} BTC` : ""}
          </div>
          <div className="flex justify-between text-sm text-[rgb(130,130,150)]">
            <span>{presale.soldCount} / {presale.totalSupply} sold</span>
            <span>{soldPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[rgb(30,30,40)] mt-2">
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
