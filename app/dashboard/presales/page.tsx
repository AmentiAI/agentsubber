"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Plus, Loader2, ExternalLink, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PresalesPage() {
  const [presales, setPresales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/presales?mine=true")
      .then((r) => r.json())
      .then((d) => setPresales(d.presales ?? []))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    UPCOMING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    ACTIVE: "text-green-400 bg-green-400/10 border-green-400/20",
    ENDED: "text-[rgb(120,120,140)] bg-[rgb(30,30,40)] border-[rgb(50,50,65)]",
    SOLD_OUT: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 px-10 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-green-400" />
              <h1 className="text-4xl font-black text-white">Presales</h1>
            </div>
            <Link href="/dashboard/presales/new">
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" /> Create Presale
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
            </div>
          ) : presales.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-[rgb(80,80,100)]" />
              <h3 className="text-xl font-bold text-white mb-2">No presales yet</h3>
              <p className="text-[rgb(130,130,150)] mb-6">Create a presale for your community members.</p>
              <Link href="/dashboard/presales/new">
                <Button variant="gradient" className="gap-2"><Plus className="w-4 h-4" />Create Presale</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {presales.map((p) => {
                const price = p.priceSOL ? `${p.priceSOL} SOL` : p.priceBTC ? `${p.priceBTC} BTC` : "TBA";
                const soldPct = p.totalSupply > 0 ? Math.round(((p.soldCount ?? 0) / p.totalSupply) * 100) : 0;
                return (
                  <Card key={p.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-white">{p.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[p.status] ?? statusColor.ENDED}`}>
                              {p.status}
                            </span>
                          </div>
                          {p.community && (
                            <div className="text-sm text-purple-400 mb-3">{p.community.name}</div>
                          )}
                          <div className="flex items-center gap-6 text-sm text-[rgb(140,140,160)] flex-wrap">
                            <span className="font-semibold text-white">{price}</span>
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.soldCount ?? 0} / {p.totalSupply} sold</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Ends {format(new Date(p.endsAt), "MMM d, yyyy")}</span>
                          </div>
                          {p.totalSupply > 0 && (
                            <div className="mt-3 w-full max-w-xs bg-[rgb(30,30,42)] rounded-full h-2">
                              <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all" style={{ width: `${soldPct}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.community && (
                            <Link href={`/c/${p.community.slug}/presale/${p.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1.5">
                                <ExternalLink className="w-4 h-4" />View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
