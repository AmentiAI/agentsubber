"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Gift, List, ShoppingBag, CreditCard, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: "Total Users", value: stats?.users ?? 0, icon: <Users className="w-6 h-6 text-blue-400" />, color: "text-blue-400" },
    { label: "Communities", value: stats?.communities ?? 0, icon: <Building2 className="w-6 h-6 text-purple-400" />, color: "text-purple-400" },
    { label: "Giveaways", value: stats?.giveaways ?? 0, icon: <Gift className="w-6 h-6 text-pink-400" />, color: "text-pink-400" },
    { label: "Allowlists", value: stats?.allowlists ?? 0, icon: <List className="w-6 h-6 text-cyan-400" />, color: "text-cyan-400" },
    { label: "Presales", value: stats?.presales ?? 0, icon: <ShoppingBag className="w-6 h-6 text-green-400" />, color: "text-green-400" },
    { label: "Payments", value: stats?.payments ?? 0, icon: <CreditCard className="w-6 h-6 text-yellow-400" />, color: "text-yellow-400" },
    { label: "Chat Messages", value: stats?.chatMessages ?? 0, icon: <MessageSquare className="w-6 h-6 text-indigo-400" />, color: "text-indigo-400" },
    { label: "Feed Posts", value: stats?.posts ?? 0, icon: <FileText className="w-6 h-6 text-orange-400" />, color: "text-orange-400" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-1">Platform Overview</h1>
        <p className="text-[rgb(130,130,150)]">Live stats for Communiclaw</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">{s.icon}<span className="text-sm text-[rgb(140,140,160)]">{s.label}</span></div>
              <div className={`text-4xl font-black ${s.color}`}>
                {loading ? "—" : s.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan breakdown + recent users */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" />Plan Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(stats?.planBreakdown ?? []).map((p: any) => (
              <div key={p.plan} className="flex items-center justify-between">
                <Badge variant={p.plan === "ELITE" ? "default" : p.plan === "PRO" ? "secondary" : "outline"}>
                  {p.plan}
                </Badge>
                <span className="text-white font-bold">{p._count.plan}</span>
              </div>
            ))}
            {!loading && !stats?.planBreakdown?.length && <div className="text-sm text-[rgb(120,120,140)]">No paid subscribers yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" />Recent Sign-ups</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(stats?.recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                  {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{u.xHandle ? `@${u.xHandle}` : u.name ?? "Unknown"}</div>
                  <div className="text-xs text-[rgb(110,110,130)]">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</div>
                </div>
                <Badge variant="secondary" className="text-xs py-0">{u.subscription?.plan ?? "FREE"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
