"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Users,
  Tag,
} from "lucide-react";
import Link from "next/link";

export default function PresalePage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const [community, setCommunity] = useState<any>(null);
  const [presale, setPresale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/communities?slug=${slug}`);
        const data = await r.json();
        const found = data.communities?.find((c: any) => c.slug === slug);
        if (!found) { setLoading(false); return; }
        const detailed = await fetch(`/api/communities/${found.id}`);
        const detailedData = await detailed.json();
        const comm = detailedData.community;
        setCommunity(comm);
        const p = (comm?.presales ?? []).find((p: any) => p.id === id);
        setPresale(p ?? null);
      } catch {
        setError("Failed to load presale");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, id]);

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/presales/${id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to process order");
        return;
      }
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (!presale) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 text-[rgb(130,130,150)] mx-auto mb-4 opacity-30" />
          <h1 className="text-2xl font-bold text-white mb-2">Presale Not Found</h1>
          <p className="text-[rgb(130,130,150)] mb-6">This presale may have ended or doesn&apos;t exist.</p>
          <Link href={`/c/${slug}`}>
            <Button variant="gradient">Back to Community</Button>
          </Link>
        </div>
      </div>
    );
  }

  const soldPct = presale.totalSupply > 0
    ? Math.round((presale.soldCount / presale.totalSupply) * 100)
    : 0;
  const remaining = presale.totalSupply - presale.soldCount;
  const priceDisplay = presale.priceSOL
    ? `${presale.priceSOL} SOL`
    : presale.priceBTC
    ? `${presale.priceBTC} BTC`
    : "Free";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href={`/c/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-[rgb(130,130,150)] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {community?.name ?? "Community"}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={presale.status === "ACTIVE" ? "live" : "secondary"}>
                  {presale.status}
                </Badge>
                {remaining <= 0 && (
                  <Badge variant="secondary">Sold Out</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{presale.name}</h1>
              {presale.description && (
                <p className="text-[rgb(200,200,210)] leading-relaxed">{presale.description}</p>
              )}
            </div>

            {/* Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[rgb(130,130,150)]">Sold</span>
                  <span className="text-sm font-semibold text-white">
                    {presale.soldCount} / {presale.totalSupply} ({soldPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[rgb(30,30,40)] mb-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500"
                    style={{ width: `${Math.min(soldPct, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-white">{presale.totalSupply}</div>
                    <div className="text-xs text-[rgb(130,130,150)]">Total Supply</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-400">{presale.soldCount}</div>
                    <div className="text-xs text-[rgb(130,130,150)]">Sold</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{remaining}</div>
                    <div className="text-xs text-[rgb(130,130,150)]">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Buy panel */}
          <aside>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-400 mb-1">{priceDisplay}</div>
                  <div className="text-sm text-[rgb(130,130,150)]">per item</div>
                </div>

                {success ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-green-400 font-semibold">Order submitted!</p>
                    <p className="text-sm text-[rgb(130,130,150)] mt-1">
                      Your order is being processed.
                    </p>
                  </div>
                ) : presale.status !== "ACTIVE" || remaining <= 0 ? (
                  <Button variant="secondary" className="w-full" disabled>
                    {remaining <= 0 ? "Sold Out" : "Presale Closed"}
                  </Button>
                ) : (
                  <form onSubmit={handleBuy} className="space-y-4">
                    <div>
                      <label className="block text-sm text-[rgb(200,200,210)] mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={Math.min(remaining, presale.maxPerWallet ?? 10)}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[rgb(200,200,210)] mb-1.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Wallet Address
                      </label>
                      <Input
                        required
                        placeholder={community?.chain === "SOL" ? "Your SOL address" : "Your BTC address"}
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-red-400 p-2 rounded bg-red-500/10 border border-red-500/20">
                        {error}
                      </div>
                    )}
                    <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Buy {quantity} {quantity === 1 ? "Item" : "Items"}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
