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
  Megaphone,
  MessageSquare,
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
  const res = await fetch(`${baseUrl}/api/communities?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const community = data.communities?.find((c: any) => c.slug === slug);
  if (!community) return null;
  const detailedRes = await fetch(`${baseUrl}/api/communities/${community.id}`, { cache: "no-store" });
  if (!detailedRes.ok) return null;
  const detailed = await detailedRes.json();
  return detailed.community ?? null;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const community = await getCommunityData(slug);
    if (!community) return { title: "Not Found" };
    return { title: community.name, description: community.description ?? undefined };
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
    <div className="min-h-screen bg-[rgb(10,10,15)]">
      <Navbar />

      {/* ── Announcement — full width strip ── */}
      {community.announcementText && (
        <div className="w-full border-b border-[rgb(40,40,55)]" style={{ backgroundColor: `${accent}20`, borderColor: `${accent}40` }}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
            <Megaphone className="w-4 h-4 shrink-0" style={{ color: accent }} />
            <p className="text-sm font-medium text-white">{community.announcementText}</p>
          </div>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="relative w-full" style={{ height: "340px" }}>
        {community.bannerUrl ? (
          <img
            src={community.bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: community.bannerPosition ?? "50% 50%" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-indigo-900/40 to-[rgb(10,10,15)]" />
        )}
        {/* Only a subtle bottom fade, not a black crush */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[rgb(10,10,15)]" />
      </div>

      {/* ── Community Identity ── */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="-mt-20 mb-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="flex items-end gap-5">
              {/* Logo */}
              <div
                className="w-36 h-36 rounded-3xl border-4 bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-5xl font-black shrink-0 overflow-hidden shadow-2xl"
                style={{ borderColor: "rgb(10,10,15)" }}
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

              {/* Name + meta */}
              <div className="pb-2 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-5xl font-black text-white leading-none">{community.name}</h1>
                  {community.verified && <CheckCircle className="w-7 h-7 text-purple-400 shrink-0" />}
                  <Badge variant={community.chain === "SOL" ? "sol" : "btc"} className="text-sm px-3 py-1">
                    {chainIcon} {community.chain}
                  </Badge>
                  {community.memberAccess?.gateType !== "OPEN" && (
                    <Badge variant="secondary" className="gap-1.5 text-sm">
                      <Shield className="w-3.5 h-3.5" />Token Gated
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-3 py-1 rounded-full border"
                        style={{ color: accent, borderColor: `${accent}50`, backgroundColor: `${accent}15` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {community.twitterHandle && (
                    <a href={`https://twitter.com/${community.twitterHandle}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <Twitter className="w-3.5 h-3.5" />Twitter
                      </Button>
                    </a>
                  )}
                  {community.discordInvite && (
                    <a href={community.discordInvite} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <MessageCircle className="w-3.5 h-3.5" />Discord
                      </Button>
                    </a>
                  )}
                  {community.telegramLink && (
                    <a href={community.telegramLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <Send className="w-3.5 h-3.5" />Telegram
                      </Button>
                    </a>
                  )}
                  {community.websiteUrl && (
                    <a href={community.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <Globe className="w-3.5 h-3.5" />Website
                      </Button>
                    </a>
                  )}
                  {community.instagramUrl && (
                    <a href={community.instagramUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <Instagram className="w-3.5 h-3.5" />Instagram
                      </Button>
                    </a>
                  )}
                  {community.youtubeUrl && (
                    <a href={community.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <Youtube className="w-3.5 h-3.5" />YouTube
                      </Button>
                    </a>
                  )}
                  {community.magicEdenUrl && (
                    <a href={community.magicEdenUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <ExternalLink className="w-3.5 h-3.5" />Magic Eden
                      </Button>
                    </a>
                  )}
                  {community.tensorUrl && (
                    <a href={community.tensorUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1.5 rounded-full h-8 px-4 text-sm">
                        <ExternalLink className="w-3.5 h-3.5" />Tensor
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              <Link href={`/c/${community.slug}/board`}>
                <Button variant="gradient" className="gap-2">
                  <MessageSquare className="w-4 h-4" />Community Board
                </Button>
              </Link>
              {isOwner && (
                <Link href={`/c/${community.slug}/manage`}>
                  <Button variant="secondary" className="gap-2">
                    <Settings className="w-4 h-4" />Manage
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        {community.description && (
          <p className="text-xl text-[rgb(200,200,215)] leading-relaxed mb-8 max-w-3xl">
            {community.description}
          </p>
        )}

        {/* ── Stats bar (4 big numbers) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Gift className="w-6 h-6 text-purple-400" />} label="Active Giveaways" value={activeGiveaways.length} accent={accent} />
          <StatCard icon={<List className="w-6 h-6 text-indigo-400" />} label="Open Allowlists" value={activeAllowlists.length} accent={accent} />
          <StatCard icon={<ShoppingBag className="w-6 h-6 text-green-400" />} label="Presales" value={activePresales.length} accent={accent} />
          <StatCard icon={<Users className="w-6 h-6 text-blue-400" />} label="Members" value={formatNumber(community.memberCount)} accent={accent} />
        </div>

        {/* ── Collection Info bar ── */}
        {hasCollectionStats && (
          <div className="flex flex-wrap gap-8 py-6 px-8 bg-[rgb(18,18,26)] rounded-2xl border border-[rgb(35,35,50)] mb-8">
            {community.totalSupply != null && (
              <div>
                <div className="text-3xl font-black" style={{ color: accent }}>
                  {community.totalSupply.toLocaleString()}
                </div>
                <div className="text-sm text-[rgb(130,130,150)] mt-0.5">Total Supply</div>
              </div>
            )}
            {community.mintPrice && (
              <div>
                <div className="text-3xl font-black" style={{ color: accent }}>{community.mintPrice}</div>
                <div className="text-sm text-[rgb(130,130,150)] mt-0.5">Mint Price</div>
              </div>
            )}
            {community.mintDate && (
              <div>
                <div className="text-3xl font-black" style={{ color: accent }}>{community.mintDate}</div>
                <div className="text-sm text-[rgb(130,130,150)] mt-0.5">Mint Date</div>
              </div>
            )}
            <div>
              <div className="text-3xl font-black" style={{ color: accent }}>
                {community.memberAccess?.gateType === "OPEN" ? "Open" : "Gated"}
              </div>
              <div className="text-sm text-[rgb(130,130,150)] mt-0.5">Access</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {format(new Date(community.createdAt), "MMM yyyy")}
              </div>
              <div className="text-sm text-[rgb(130,130,150)] mt-0.5">Created</div>
            </div>
          </div>
        )}

        {/* ── Connect CTA (not logged in) ── */}
        {!session && (
          <div
            className="flex items-center justify-between gap-4 px-8 py-6 rounded-2xl border mb-8"
            style={{ backgroundColor: `${accent}12`, borderColor: `${accent}30` }}
          >
            <div>
              <p className="text-lg font-bold text-white mb-1">Join this community</p>
              <p className="text-sm text-[rgb(160,160,180)]">Connect your X account and wallet to enter giveaways and join allowlists.</p>
            </div>
            <Link href="/login">
              <Button variant="gradient" className="gap-2 shrink-0" size="lg">
                <Twitter className="w-4 h-4" />
                Connect with X
              </Button>
            </Link>
          </div>
        )}

        {/* ── Main content + sidebar ── */}
        <div className="grid lg:grid-cols-3 gap-8 pb-20">
          {/* Left 2/3 — campaigns */}
          <div className="lg:col-span-2 space-y-10">

            {/* Giveaways */}
            {activeGiveaways.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                    <Gift className="w-6 h-6 text-purple-400" />
                    Active Giveaways
                  </h2>
                  <Badge variant="live" className="text-sm px-3 py-1">Live</Badge>
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
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5 mb-5">
                  <List className="w-6 h-6 text-indigo-400" />
                  Open Allowlists
                </h2>
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
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5 mb-5">
                  <ShoppingBag className="w-6 h-6 text-green-400" />
                  Presales
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {activePresales.map((p: any) => (
                    <PresaleCard key={p.id} presale={p} communitySlug={community.slug} />
                  ))}
                </div>
              </section>
            )}

            {activeGiveaways.length === 0 && activeAllowlists.length === 0 && activePresales.length === 0 && (
              <div className="text-center py-24 text-[rgb(130,130,150)]">
                <Gift className="w-20 h-20 mx-auto mb-5 opacity-20" />
                <p className="text-2xl font-bold text-[rgb(160,160,180)] mb-2">No active campaigns yet</p>
                <p className="text-base">Check back soon — this community is gearing up!</p>
              </div>
            )}
          </div>

          {/* Right 1/3 — About sidebar */}
          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Chain", value: <span className={`font-bold ${chainColor}`}>{chainIcon} {community.chain}</span> },
                  { label: "Access", value: community.memberAccess?.gateType === "OPEN" ? "Open" : "Gated" },
                  {
                    label: "Owner",
                    value: community.owner?.xHandle
                      ? `@${community.owner.xHandle}`
                      : community.owner?.name ?? "Unknown",
                  },
                  { label: "Members", value: formatNumber(community.memberCount) },
                  { label: "Created", value: format(new Date(community.createdAt), "MMM yyyy") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-[rgb(130,130,150)]">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}

                {/* Social links */}
                {(community.twitterHandle || community.discordInvite || community.telegramLink ||
                  community.websiteUrl || community.instagramUrl || community.youtubeUrl ||
                  community.magicEdenUrl || community.tensorUrl) && (
                  <div className="pt-3 border-t border-[rgb(40,40,55)] space-y-2.5">
                    {community.twitterHandle && (
                      <SidebarLink href={`https://twitter.com/${community.twitterHandle}`} icon={<Twitter className="w-4 h-4" />} label={`@${community.twitterHandle}`} />
                    )}
                    {community.discordInvite && (
                      <SidebarLink href={community.discordInvite} icon={<MessageCircle className="w-4 h-4" />} label="Discord Server" />
                    )}
                    {community.telegramLink && (
                      <SidebarLink href={community.telegramLink} icon={<Send className="w-4 h-4" />} label="Telegram" />
                    )}
                    {community.websiteUrl && (
                      <SidebarLink href={community.websiteUrl} icon={<Globe className="w-4 h-4" />} label="Website" />
                    )}
                    {community.instagramUrl && (
                      <SidebarLink href={community.instagramUrl} icon={<Instagram className="w-4 h-4" />} label="Instagram" />
                    )}
                    {community.youtubeUrl && (
                      <SidebarLink href={community.youtubeUrl} icon={<Youtube className="w-4 h-4" />} label="YouTube" />
                    )}
                    {community.magicEdenUrl && (
                      <SidebarLink href={community.magicEdenUrl} icon={<ExternalLink className="w-4 h-4" />} label="Magic Eden" />
                    )}
                    {community.tensorUrl && (
                      <SidebarLink href={community.tensorUrl} icon={<ExternalLink className="w-4 h-4" />} label="Tensor" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2.5 text-[rgb(140,140,160)] hover:text-white transition-colors group">
      <span className="shrink-0 group-hover:text-purple-400 transition-colors">{icon}</span>
      <span className="text-sm truncate">{label}</span>
    </a>
  );
}

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number | string; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[rgb(25,25,35)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-3xl font-black text-white">{value}</div>
          <div className="text-sm text-[rgb(130,130,150)] mt-0.5">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GiveawayCard({ giveaway, communitySlug, accent }: {
  giveaway: any; communitySlug: string; accent?: string;
}) {
  return (
    <Card className="card-hover flex flex-col">
      <CardContent className="p-7 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white leading-tight">{giveaway.title}</h3>
          <Badge variant="live" className="shrink-0 ml-3">Live</Badge>
        </div>
        <p className="text-lg font-bold mb-4" style={{ color: accent ?? "#a78bfa" }}>
          🏆 {giveaway.prize}
        </p>
        <div className="flex items-center gap-4 text-base text-[rgb(130,130,150)] mb-6">
          <span>{giveaway._count?.entries ?? 0} entries</span>
          <span>·</span>
          <span>{giveaway.totalWinners} winner{giveaway.totalWinners !== 1 ? "s" : ""}</span>
          <span className="text-yellow-400 ml-auto font-medium">⏱ {timeUntil(new Date(giveaway.endAt))}</span>
        </div>
        <div className="mt-auto">
          <Link href={`/c/${communitySlug}/giveaways/${giveaway.id}`}>
            <Button variant="gradient" className="w-full gap-2" size="lg">
              <Gift className="w-5 h-5" />Enter Giveaway
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function AllowlistCard({ allowlist, communitySlug, accent }: {
  allowlist: any; communitySlug: string; accent?: string;
}) {
  const pct = Math.round((allowlist.filledSpots / allowlist.totalSpots) * 100);
  const isFull = allowlist.filledSpots >= allowlist.totalSpots;
  return (
    <Card className="card-hover">
      <CardContent className="p-7">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-white">{allowlist.name}</h3>
          <Badge variant="secondary" className="shrink-0 ml-3 text-sm">{allowlist.entryMethod}</Badge>
        </div>
        <div className="flex justify-between text-base text-[rgb(130,130,150)] mb-3">
          <span>{allowlist.filledSpots} / {allowlist.totalSpots} spots</span>
          <span className="font-semibold">{pct}%{isFull ? " · Full" : ""}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[rgb(30,30,40)] mb-4">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: `linear-gradient(to right, ${accent ?? "#7c3aed"}, ${accent ? accent + "aa" : "#4f46e5"})`,
            }}
          />
        </div>
        {allowlist.closesAt && (
          <p className="text-sm text-[rgb(130,130,150)] mb-5">⏰ Closes {timeUntil(new Date(allowlist.closesAt))}</p>
        )}
        <Link href={`/c/${communitySlug}/allowlist/${allowlist.id}`}>
          <Button variant="gradient" className="w-full gap-2" size="lg" disabled={isFull}>
            <List className="w-5 h-5" />
            {isFull ? "Full — View Waitlist" : "Join Allowlist"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function PresaleCard({ presale, communitySlug }: { presale: any; communitySlug: string }) {
  const soldPct = Math.round((presale.soldCount / presale.totalSupply) * 100);
  const soldOut = presale.soldCount >= presale.totalSupply;
  return (
    <Card className="card-hover flex flex-col">
      <CardContent className="p-7 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-white">{presale.name}</h3>
          {soldOut && <Badge variant="secondary" className="ml-3">Sold Out</Badge>}
        </div>
        <div className="text-2xl font-black text-green-400 mb-4">
          {presale.priceSOL ? `${presale.priceSOL} SOL` : presale.priceBTC ? `${presale.priceBTC} BTC` : "TBA"}
        </div>
        <div className="flex justify-between text-base text-[rgb(130,130,150)] mb-2">
          <span>{presale.soldCount} / {presale.totalSupply} sold</span>
          <span className="font-semibold">{soldPct}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[rgb(30,30,40)] mb-6">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500"
            style={{ width: `${Math.min(soldPct, 100)}%` }}
          />
        </div>
        <div className="mt-auto">
          <Link href={`/c/${communitySlug}/presale/${presale.id}`}>
            <Button variant="gradient" className="w-full gap-2" size="lg" disabled={soldOut}>
              <ShoppingBag className="w-5 h-5" />
              {soldOut ? "Sold Out" : "Buy Now"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
