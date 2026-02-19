"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, Trash2, Star, StarOff, Loader2, ExternalLink, ChevronLeft, ChevronRight, Users, Gift } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async (q = search, p = page) => {
    setLoading(true);
    const res = await fetch(`/api/admin/communities?q=${encodeURIComponent(q)}&page=${p}`);
    const d = await res.json();
    setCommunities(d.communities ?? []);
    setTotal(d.total ?? 0);
    setPages(d.pages ?? 1);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const doSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(search, 1); };

  const deleteCommunity = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" permanently? This removes all giveaways, allowlists, and presales.`)) return;
    setActing(id);
    await fetch("/api/admin/communities", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ communityId: id }) });
    await load();
    setActing(null);
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    setActing(id);
    await fetch("/api/admin/communities", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ communityId: id, featured: !featured }) });
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, featured: !featured } : c));
    setActing(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white mb-1">Communities</h1>
        <p className="text-[rgb(130,130,150)]">{total.toLocaleString()} total</p>
      </div>

      <form onSubmit={doSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(100,100,120)]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities…" className="pl-9" />
        </div>
        <Button type="submit" variant="gradient">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : (
        <div className="space-y-3">
          {communities.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[rgb(25,25,38)] flex items-center justify-center overflow-hidden shrink-0 text-lg">
                      {c.logoUrl && !c.logoUrl.startsWith("data:") ? <img src={c.logoUrl} alt="" className="w-full h-full object-cover" /> : "🏛️"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white text-lg">{c.name}</span>
                        <Badge variant={c.chain === "SOL" ? "sol" : "btc"} className="text-xs">{c.chain}</Badge>
                        {c.featured && <Badge variant="default" className="text-xs gap-1"><Star className="w-2.5 h-2.5" />Featured</Badge>}
                      </div>
                      <div className="text-xs text-[rgb(110,110,130)] flex gap-3 flex-wrap">
                        <span>by {c.owner?.xHandle ? `@${c.owner.xHandle}` : c.owner?.name ?? "unknown"}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Gift className="w-3 h-3" />{c._count?.giveaways ?? 0} giveaways</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c._count?.followers ?? 0} followers</span>
                        <span>·</span>
                        <span>created {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/c/${c.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs"><ExternalLink className="w-3 h-3" />View</Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" disabled={acting === c.id} onClick={() => toggleFeatured(c.id, c.featured)}>
                      {c.featured ? <StarOff className="w-3 h-3 text-yellow-400" /> : <Star className="w-3 h-3 text-yellow-400" />}
                      {c.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-400 hover:bg-red-500/10" disabled={acting === c.id} onClick={() => deleteCommunity(c.id, c.name)}>
                      {acting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center gap-3 justify-center">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-[rgb(140,140,160)]">Page {page} of {pages}</span>
          <Button variant="ghost" size="sm" disabled={page === pages} onClick={() => setPage(p => Math.min(pages, p + 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}
