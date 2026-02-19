"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, RefreshCw, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/payments");
    const d = await res.json();
    setPayments(d.payments ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = payments.filter(p => p.status === "CONFIRMED").reduce((sum, p) => sum + (p.amountUsd ?? 0), 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-1">Payments</h1>
          <p className="text-[rgb(130,130,150)]">{payments.length} total · <span className="text-green-400 font-bold">${totalRevenue.toFixed(2)} confirmed</span></p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : payments.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-[rgb(100,100,120)]">No payment records yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[rgb(25,25,38)] flex items-center justify-center">
                      {p.chain === "BTC" ? <Bitcoin className="w-5 h-5 text-orange-400" /> : <CreditCard className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{p.amountUsd ? `$${p.amountUsd}` : p.amountSats ? `${p.amountSats} sats` : p.amount ?? "—"}</span>
                        <Badge variant={p.chain === "BTC" ? "btc" : "sol"} className="text-xs">{p.chain}</Badge>
                        <Badge variant={p.status === "CONFIRMED" ? "default" : p.status === "PENDING" ? "secondary" : "outline"} className="text-xs">
                          {p.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-[rgb(110,110,130)] flex gap-2 flex-wrap">
                        <span>{p.user?.xHandle ? `@${p.user.xHandle}` : p.user?.name ?? "unknown"}</span>
                        <span>·</span>
                        <span>{p.plan ?? "—"}</span>
                        {p.txHash && <><span>·</span><span className="font-mono truncate max-w-[120px]">{p.txHash}</span></>}
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
