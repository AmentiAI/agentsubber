"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  Loader2,
  Star,
  ShieldCheck,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// @ts-ignore
import bs58 from "bs58";

interface WalletRecord {
  id: string;
  address: string;
  chain: string;
  label: string | null;
  verified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ address: "", chain: "SOL", label: "" });
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  const solWallet = useWallet();

  useEffect(() => {
    fetch("/api/wallets")
      .then((r) => r.json())
      .then((data) => setWallets(data.wallets ?? []))
      .finally(() => setLoading(false));
  }, []);

  function copyAddress(wallet: WalletRecord) {
    navigator.clipboard.writeText(wallet.address);
    setCopiedId(wallet.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function addWallet(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add wallet");
        return;
      }
      setWallets((prev) => [...prev, data.wallet]);
      setShowForm(false);
      setForm({ address: "", chain: "SOL", label: "" });
    } finally {
      setAdding(false);
    }
  }

  async function removeWallet(walletId: string) {
    if (!confirm("Remove this wallet?")) return;
    const res = await fetch("/api/wallets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    if (res.ok) {
      setWallets((prev) => prev.filter((w) => w.id !== walletId));
    }
  }

  async function setPrimary(walletId: string) {
    const res = await fetch("/api/wallets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    if (res.ok) {
      setWallets((prev) =>
        prev.map((w) => ({ ...w, isPrimary: w.id === walletId }))
      );
    }
  }

  async function verifySOLWallet(wallet: WalletRecord) {
    if (!solWallet.signMessage) {
      setVerifyMsg({ id: wallet.id, type: "error", text: "Wallet does not support message signing. Please connect a compatible Solana wallet." });
      return;
    }
    if (!solWallet.connected || solWallet.publicKey?.toBase58() !== wallet.address) {
      setVerifyMsg({ id: wallet.id, type: "error", text: `Please connect the wallet with address ${truncateAddress(wallet.address, 6)} using the Connect button above.` });
      return;
    }
    setVerifying(wallet.id);
    setVerifyMsg(null);
    try {
      // 1. Get challenge
      const challengeRes = await fetch("/api/wallets/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.address }),
      });
      const { message } = await challengeRes.json();

      // 2. Sign the message
      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = await solWallet.signMessage(msgBytes);
      const signature = bs58.encode(sigBytes);

      // 3. Verify signature on server
      const verifyRes = await fetch("/api/wallets/verify-sig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId: wallet.id, address: wallet.address, message, signature, chain: "SOL" }),
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setWallets((prev) => prev.map((w) => w.id === wallet.id ? { ...w, verified: true } : w));
        setVerifyMsg({ id: wallet.id, type: "success", text: "✓ Wallet verified successfully!" });
      } else {
        setVerifyMsg({ id: wallet.id, type: "error", text: verifyData.error ?? "Verification failed" });
      }
    } catch (err: any) {
      setVerifyMsg({ id: wallet.id, type: "error", text: err?.message ?? "Signing cancelled or failed" });
    } finally {
      setVerifying(null);
    }
  }

  const chainColors: Record<string, string> = {
    SOL: "text-purple-400",
    BTC: "text-orange-400",
    ETH: "text-blue-400",
  };
  const chainBadgeVariants: Record<string, any> = {
    SOL: "sol",
    BTC: "btc",
    ETH: "default",
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-purple-400" />
                <h1 className="text-4xl font-black text-white">My Wallets</h1>
              </div>
              <Button
                variant="gradient"
                className="gap-2"
                onClick={() => setShowForm(!showForm)}
              >
                <Plus className="w-4 h-4" />
                Add Wallet
              </Button>
            </div>

            {/* Solana Wallet Connect */}
            <div className="mb-5 p-4 rounded-xl bg-[rgb(20,20,28)] border border-[rgb(40,40,55)] flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">Connect Solana Wallet</div>
                <div className="text-xs text-[rgb(130,130,150)]">Connect to sign & verify ownership of your Solana wallets</div>
              </div>
              <WalletMultiButton style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: "10px", fontSize: "13px", height: "38px" }} />
            </div>

            {showForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Add Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addWallet} className="space-y-4">
                    <div>
                      <label className="block text-base text-[rgb(200,200,210)] mb-1.5">
                        Chain
                      </label>
                      <div className="flex gap-2">
                        {["SOL", "BTC"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, chain: c }))}
                            className={`px-4 py-2 rounded-lg border text-base font-medium transition-all ${
                              form.chain === c
                                ? "border-purple-500 bg-purple-600/10"
                                : "border-[rgb(40,40,55)] hover:border-[rgb(80,80,100)]"
                            } ${chainColors[c]}`}
                          >
                            {c === "SOL" ? "◎ Solana" : "₿ Bitcoin"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-base text-[rgb(200,200,210)] mb-1.5">
                        Wallet Address *
                      </label>
                      <Input
                        required
                        placeholder={
                          form.chain === "SOL"
                            ? "e.g. 7xKXtg2CW8..."
                            : "e.g. bc1q..."
                        }
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-[rgb(200,200,210)] mb-1.5">
                        Label (optional)
                      </label>
                      <Input
                        placeholder="e.g. Main wallet"
                        value={form.label}
                        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        {error}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="gradient" disabled={adding}>
                        {adding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Add Wallet"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-5">
                  <Wallet className="w-10 h-10 text-[rgb(130,130,150)]" />
                </div>
                <h3 className="text-xl text-white font-bold mb-2">No wallets connected</h3>
                <p className="text-[rgb(130,130,150)] text-base">
                  Add a Solana or Bitcoin wallet to enter giveaways and allowlists.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <Card key={wallet.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-xl bg-[rgb(30,30,40)] flex items-center justify-center shrink-0 text-2xl ${chainColors[wallet.chain]}`}>
                            {wallet.chain === "SOL" ? "◎" : "₿"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <code className="text-base text-white font-mono">
                                {truncateAddress(wallet.address, 6)}
                              </code>
                              <Badge variant={chainBadgeVariants[wallet.chain]} className="text-xs py-0">
                                {wallet.chain}
                              </Badge>
                              {wallet.isPrimary && (
                                <Badge variant="default" className="text-xs py-0 gap-1">
                                  <Star className="w-2.5 h-2.5" />
                                  Primary
                                </Badge>
                              )}
                              {wallet.verified ? (
                                <Badge variant="success" className="text-xs py-0 gap-1">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs py-0">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            {wallet.label && (
                              <div className="text-sm text-[rgb(130,130,150)]">
                                {wallet.label}
                              </div>
                            )}
                            {/* Verify message */}
                            {verifyMsg?.id === wallet.id && (
                              <div className={`text-xs mt-1 ${verifyMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                                {verifyMsg.text}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                          {/* SOL verify button */}
                          {wallet.chain === "SOL" && !wallet.verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verifySOLWallet(wallet)}
                              disabled={verifying === wallet.id}
                              className="text-xs gap-1 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                            >
                              {verifying === wallet.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3 h-3" />
                              )}
                              Sign & Verify
                            </Button>
                          )}
                          {!wallet.isPrimary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPrimary(wallet.id)}
                              className="text-xs gap-1"
                            >
                              <Star className="w-3 h-3" />
                              Set Primary
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyAddress(wallet)}
                          >
                            {copiedId === wallet.id ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWallet(wallet.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
