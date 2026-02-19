"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trash2, Loader2, ExternalLink, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AdminGiveawaysPage() {
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/giveaways");
    const d = await res.json();
    setGiveaways(d.giveaways ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteGiveaway = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setActing(id);
    await fetch("/api/admin/giveaways", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giveawayId: id }) });
    setGiveaways(prev => prev.filter(g => g.id !== id));
    setActing(null);
  };

  const drawWinners = async (id: string) => {
    setActing(id);
    const res = await fetch("/api/admin/giveaways", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giveawayId: id, action: "draw" }) });
    const d = await res.json();
    if (d.ok) await load();
    setActing(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white mb-1">Giveaways</h1>
        <p className="text-[rgb(130,130,150)]">{giveaways.length} giveaways</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : (
        <div className="space-y-3">
          {giveaways.map((g) => {
            const ended = new Date(g.endsAt) < new Date();
            return (
              <Card key={g.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white text-lg">{g.name}</span>
                        <Badge variant={g.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{g.status}</Badge>
                        {ended && <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/30">Ended</Badge>}
                      </div>
                      <div className="text-xs text-[rgb(110,110,130)] flex gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{g._count?.entries ?? 0} entries</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{g.winnersCount} winners</span>
                        <span>·</span>
                        <span>in {g.community?.name ?? "unknown"}</span>
                        <span>·</span>
                        <span>{ended ? "ended" : "ends"} {formatDistanceToNow(new Date(g.endsAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {g.status === "ACTIVE" && ended && (
                        <Button variant="gradient" size="sm" className="gap-1 text-xs" disabled={acting === g.id} onClick={() => drawWinners(g.id)}>
                          {acting === g.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}Draw Winners
                        </Button>
                      )}
                      <Link href={`/c/${g.community?.slug}/giveaways/${g.id}`} target="_blank">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs"><ExternalLink className="w-3 h-3" />View</Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-400 hover:bg-red-500/10" disabled={acting === g.id} onClick={() => deleteGiveaway(g.id, g.name)}>
                        <Trash2 className="w-3 h-3" />Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
