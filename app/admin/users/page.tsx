"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Ban, CheckCircle, Trash2, Crown, Zap, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PLANS = ["FREE", "PRO", "ELITE"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async (q = search, p = page) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${p}`);
    const d = await res.json();
    setUsers(d.users ?? []);
    setTotal(d.total ?? 0);
    setPages(d.pages ?? 1);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const doSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(search, 1); };

  const action = async (userId: string, act: string, extra?: any) => {
    if (act === "delete" && !confirm("Delete this user permanently?")) return;
    setActing(userId);
    const method = act === "delete" ? "DELETE" : "PATCH";
    await fetch("/api/admin/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: act, ...extra }),
    });
    await load();
    setActing(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-1">Users</h1>
          <p className="text-[rgb(130,130,150)]">{total.toLocaleString()} total</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={doSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(100,100,120)]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, @handle, email…" className="pl-9" />
        </div>
        <Button type="submit" variant="gradient">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[rgb(25,25,38)] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden text-lg">
                      {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] ?? "?")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white">{u.name ?? "No name"}</span>
                        {u.xHandle && <span className="text-purple-400 text-sm">@{u.xHandle}</span>}
                        <Badge variant={u.subscription?.plan === "ELITE" ? "default" : u.subscription?.plan === "PRO" ? "secondary" : "outline"} className="text-xs">
                          {u.subscription?.plan ?? "FREE"}
                        </Badge>
                        {u.banned && <Badge variant="destructive" className="text-xs">BANNED</Badge>}
                      </div>
                      <div className="text-xs text-[rgb(110,110,130)] flex gap-3 flex-wrap">
                        <span>{u.email ?? "no email"}</span>
                        <span>·</span>
                        <span>{u._count?.ownedCommunities ?? 0} communities</span>
                        <span>·</span>
                        <span>{u._count?.wallets ?? 0} wallets</span>
                        <span>·</span>
                        <span>joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Plan buttons */}
                    {PLANS.map((plan) => (
                      <Button key={plan} variant="ghost" size="sm" className="text-xs gap-1"
                        disabled={acting === u.id || u.subscription?.plan === plan}
                        onClick={() => action(u.id, "set_plan", { plan })}>
                        {plan === "ELITE" ? <Crown className="w-3 h-3 text-yellow-400" /> : plan === "PRO" ? <Zap className="w-3 h-3 text-purple-400" /> : null}
                        {plan}
                      </Button>
                    ))}
                    {/* Ban/Unban */}
                    {u.banned ? (
                      <Button variant="outline" size="sm" className="gap-1 text-green-400 border-green-500/40 hover:bg-green-500/10"
                        disabled={acting === u.id} onClick={() => action(u.id, "unban")}>
                        <CheckCircle className="w-3 h-3" />Unban
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1 text-orange-400 border-orange-500/40 hover:bg-orange-500/10"
                        disabled={acting === u.id} onClick={() => action(u.id, "ban")}>
                        <Ban className="w-3 h-3" />Ban
                      </Button>
                    )}
                    {/* Delete */}
                    <Button variant="ghost" size="sm" className="gap-1 text-red-400 hover:bg-red-500/10"
                      disabled={acting === u.id} onClick={() => action(u.id, "delete")}>
                      {acting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-3 justify-center pt-2">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-[rgb(140,140,160)]">Page {page} of {pages}</span>
          <Button variant="ghost" size="sm" disabled={page === pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
