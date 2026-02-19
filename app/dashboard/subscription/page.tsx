"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  CreditCard,
  Zap,
  Crown,
  Star,
  Loader2,
  AlertTriangle,
  Bitcoin,
  X,
  ExternalLink,
  Clock,
  Send,
  Wallet,
} from "lucide-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import Navbar from "@/components/layout/Navbar";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Star,
    color: "text-[rgb(200,200,210)]",
    features: [
      "1 community",
      "3 active giveaways",
      "1 allowlist campaign",
      "1 OpenClaw agent",
      "X & wallet connect",
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$9.99",
    period: "per month",
    icon: Zap,
    color: "text-purple-400",
    features: [
      "5 communities",
      "Unlimited giveaways",
      "Unlimited allowlists",
      "Collab system",
      "Presales",
      "2x giveaway multiplier",
      "Priority support",
    ],
  },
  {
    key: "ELITE",
    name: "Elite",
    price: "$24.99",
    period: "per month",
    icon: Crown,
    color: "text-yellow-400",
    features: [
      "Unlimited communities",
      "Everything in Pro",
      "Wallet tracker & alerts",
      "Advanced analytics",
      "3x giveaway multiplier",
      "Verification badge",
      "Discord bot",
    ],
  },
];

// ─── BTC wallet helpers ──────────────────────────────────────────────────────
declare const window: any;

async function detectBtcWallet(): Promise<string | null> {
  if (window?.unisat) return "unisat";
  if (window?.XverseProviders?.BitcoinProvider) return "xverse";
  if (window?.LeatherProvider) return "leather";
  if (window?.magicEden?.bitcoin) return "magiceden";
  return null;
}

async function btcSendPayment(toAddress: string, amountSats: number): Promise<string> {
  const provider = await detectBtcWallet();
  if (!provider) throw new Error("No Bitcoin wallet detected. Install Xverse or Unisat.");

  if (provider === "unisat") {
    const txid = await window.unisat.sendBitcoin(toAddress, amountSats);
    if (!txid) throw new Error("Unisat returned no txid");
    return txid;
  }
  if (provider === "xverse") {
    return new Promise((resolve, reject) => {
      window.XverseProviders.BitcoinProvider.request("sendTransfer", {
        recipients: [{ address: toAddress, amount: amountSats }],
      }).then((resp: any) => {
        const txid = resp?.result?.txid ?? resp?.txid;
        if (!txid) reject(new Error("Xverse returned no txid"));
        else resolve(txid);
      }).catch(reject);
    });
  }
  if (provider === "leather") {
    const resp = await window.LeatherProvider.request("sendTransfer", {
      network: "mainnet",
      recipients: [{ address: toAddress, amount: String(amountSats) }],
    });
    const txid = resp?.result?.txid;
    if (!txid) throw new Error("Leather returned no txid");
    return txid;
  }
  if (provider === "magiceden") {
    const resp = await window.magicEden.bitcoin.sendBitcoin({ toAddress, satoshis: amountSats });
    return resp.txid ?? resp.txID ?? resp;
  }
  throw new Error("Unsupported wallet");
}

// ─── Main payment panel ───────────────────────────────────────────────────────

function CryptoPayPanel({ plan, onClose }: { plan: string; onClose: () => void }) {
  const solWallet = useWallet();
  const { connection } = useConnection();

  const [chain, setChain] = useState<"BTC" | "SOL" | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{ id: string; address: string; lamports?: number; sats?: number; displayAmount: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "sending" | "polling" | "confirmed" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txSig, setTxSig] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const planLabel = plan === "PRO" ? "Pro — $9.99/mo" : "Elite — $24.99/mo";

  // ── Step 1: user selects chain → fetch payment details from backend
  async function selectChain(c: "BTC" | "SOL") {
    setChain(c);
    setStatus("creating");
    setErrorMsg("");
    try {
      const res = await fetch("/api/billing/crypto-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, chain: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create payment");
      // data: { payment: {id}, amount (e.g. "0.0555"), address, amountSats?, lamports? }
      setPaymentInfo({
        id: data.payment.id,
        address: data.address,
        lamports: data.lamports,
        sats: data.amountSats,
        displayAmount: data.amount,
      });
      setStatus("idle");
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  }

  // ── Step 2a: SOL — use wallet adapter to send
  async function paySol() {
    if (!paymentInfo || !solWallet.publicKey || !solWallet.sendTransaction) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const lamports = paymentInfo.lamports ?? Math.round(parseFloat(paymentInfo.displayAmount) * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: solWallet.publicKey,
          toPubkey: new PublicKey(paymentInfo.address),
          lamports,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = solWallet.publicKey;

      const sig = await solWallet.sendTransaction(tx, connection);
      setTxSig(sig);
      startPolling(paymentInfo.id, sig);
    } catch (e: any) {
      setErrorMsg(e.message ?? "Transaction rejected");
      setStatus("error");
    }
  }

  // ── Step 2b: BTC — use wallet extension to send
  async function payBtc() {
    if (!paymentInfo) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const sats = paymentInfo.sats ?? Math.round(parseFloat(paymentInfo.displayAmount) * 1e8);
      const txid = await btcSendPayment(paymentInfo.address, sats);
      setTxSig(txid);
      startPolling(paymentInfo.id, txid);
    } catch (e: any) {
      setErrorMsg(e.message ?? "Transaction rejected");
      setStatus("error");
    }
  }

  // ── Step 3: poll backend for confirmation
  function startPolling(paymentId: string, txHash: string) {
    setStatus("polling");
    let attempts = 0;
    const MAX = 40; // ~5 min for BTC, ~2 min for SOL
    const interval = chain === "BTC" ? 8000 : 3000;

    const poll = async () => {
      attempts++;
      setPollCount(attempts);
      try {
        const res = await fetch("/api/billing/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, txHash }),
        });
        const data = await res.json();
        if (data.confirmed) {
          setStatus("confirmed");
          return;
        }
      } catch {}
      if (attempts < MAX) setTimeout(poll, interval);
      else {
        setStatus("error");
        setErrorMsg("Timed out waiting for confirmation. Your plan will upgrade once the transaction confirms — check back in a few minutes.");
      }
    };
    setTimeout(poll, interval);
  }

  const explorerUrl = txSig
    ? chain === "BTC"
      ? `https://mempool.space/tx/${txSig}`
      : `https://solscan.io/tx/${txSig}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[rgb(14,14,20)] border-t sm:border border-[rgb(40,40,55)] sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(30,30,45)]">
          <div className="font-bold text-white">{planLabel}</div>
          <button onClick={onClose} className="text-[rgb(130,130,150)] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Confirmed ─────────────────────── */}
          {status === "confirmed" && (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">🎉</div>
              <div>
                <div className="text-xl font-black text-white mb-1">Payment Confirmed!</div>
                <div className="text-sm text-green-400">{plan} plan is now active on your account.</div>
              </div>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  View on {chain === "BTC" ? "Mempool" : "Solscan"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <Button variant="gradient" className="w-full mt-2" onClick={() => { onClose(); window.location.reload(); }}>
                Done
              </Button>
            </div>
          )}

          {/* ── Polling (waiting for confirms) ── */}
          {status === "polling" && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto" />
              <div>
                <div className="text-base font-bold text-white mb-1">Transaction Broadcast!</div>
                <div className="text-sm text-[rgb(140,140,160)]">Waiting for {chain === "BTC" ? "1 Bitcoin confirmation" : "Solana finality"}…</div>
                <div className="text-xs text-[rgb(100,100,120)] mt-1">Check #{pollCount}</div>
              </div>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on {chain === "BTC" ? "Mempool" : "Solscan"}
                </a>
              )}
              <div className="text-xs text-[rgb(100,100,120)]">You can close this — your plan will upgrade automatically once confirmed.</div>
            </div>
          )}

          {/* ── Sending ─────────────────────── */}
          {status === "sending" && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto" />
              <div className="text-sm text-white font-medium">Approve in your wallet…</div>
              <div className="text-xs text-[rgb(120,120,140)]">Check your wallet extension for the payment prompt</div>
            </div>
          )}

          {/* ── Error ───────────────────────── */}
          {status === "error" && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 mb-2 text-red-400" />
              {errorMsg}
            </div>
          )}

          {/* ── Chain selector ──────────────── */}
          {(status === "idle" || status === "creating" || status === "error") && !chain && (
            <div>
              <div className="text-sm font-medium text-[rgb(180,180,200)] mb-3">Pay with:</div>
              <div className="grid grid-cols-2 gap-3">
                {(["BTC", "SOL"] as const).map(c => (
                  <button key={c} onClick={() => selectChain(c)} disabled={status === "creating"}
                    className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all font-bold text-sm
                      ${c === "BTC"
                        ? "border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400 hover:border-orange-400"
                        : "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 hover:border-purple-400"
                      }`}>
                    {status === "creating" ? <Loader2 className="w-7 h-7 animate-spin" /> : <span className="text-3xl">{c === "BTC" ? "₿" : "◎"}</span>}
                    <span>{c === "BTC" ? "Bitcoin" : "Solana"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Payment ready — SOL ──────────── */}
          {status === "idle" && chain === "SOL" && paymentInfo && (
            <div className="space-y-5">
              <div className="bg-[rgb(18,18,26)] rounded-xl p-5 border border-[rgb(35,35,50)] text-center">
                <div className="text-xs text-[rgb(130,130,150)] mb-1">Amount</div>
                <div className="text-3xl font-black text-white mb-0.5">{paymentInfo.displayAmount} SOL</div>
                <div className="text-xs text-[rgb(100,100,120)]">to {paymentInfo.address.slice(0, 8)}…{paymentInfo.address.slice(-6)}</div>
              </div>

              {solWallet.connected ? (
                <Button variant="gradient" className="w-full h-12 text-base gap-2" onClick={paySol}>
                  <Send className="w-5 h-5" />
                  Pay {paymentInfo.displayAmount} SOL
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-center text-[rgb(130,130,150)]">Connect your Solana wallet to pay</div>
                  <div className="flex justify-center">
                    <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500 !rounded-xl !h-12 !text-base !font-bold" />
                  </div>
                </div>
              )}
              <button onClick={() => { setChain(null); setPaymentInfo(null); setStatus("idle"); setErrorMsg(""); }}
                className="w-full text-xs text-[rgb(110,110,130)] hover:text-white transition-colors">← Change chain</button>
            </div>
          )}

          {/* ── Payment ready — BTC ──────────── */}
          {status === "idle" && chain === "BTC" && paymentInfo && (
            <div className="space-y-5">
              <div className="bg-[rgb(18,18,26)] rounded-xl p-5 border border-[rgb(35,35,50)] text-center">
                <div className="text-xs text-[rgb(130,130,150)] mb-1">Amount</div>
                <div className="text-3xl font-black text-white mb-0.5">{paymentInfo.displayAmount} BTC</div>
                <div className="text-xs text-[rgb(100,100,120)]">{paymentInfo.sats?.toLocaleString()} sats · to {paymentInfo.address.slice(0, 10)}…{paymentInfo.address.slice(-6)}</div>
              </div>

              <Button variant="gradient" className="w-full h-12 text-base gap-2" onClick={payBtc}>
                <Send className="w-5 h-5" />
                Pay with Bitcoin Wallet
              </Button>
              <div className="text-xs text-center text-[rgb(100,100,120)]">Works with Xverse, Unisat, Leather, Magic Eden</div>
              <button onClick={() => { setChain(null); setPaymentInfo(null); setStatus("idle"); setErrorMsg(""); }}
                className="w-full text-xs text-[rgb(110,110,130)] hover:text-white transition-colors">← Change chain</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cryptoPayPlan, setCryptoPayPlan] = useState<string | null>(null);
  const successParam = searchParams.get("success");

  const user = session?.user as any;
  const currentPlan = user?.plan ?? "FREE";

  async function subscribe(plan: "PRO" | "ELITE") {
    setLoading(plan);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (!res.ok) {
        alert(data.error ?? "Something went wrong — try again.");
      } else if (data.txHash) {
        // Crypto payment — show confirmation
        alert(`Payment received! TX: ${data.txHash}`);
        window.location.reload();
      }
    } finally {
      setLoading(null);
    }
  }

  async function cancelSubscription() {
    if (!confirm("Are you sure you want to cancel? You'll keep Pro/Elite until the period ends.")) return;
    setCancelling(true);
    try {
      await fetch("/api/subscribe", { method: "DELETE" });
      window.location.reload();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      {cryptoPayPlan && (
        <CryptoPayPanel
          plan={cryptoPayPlan}
          onClose={() => setCryptoPayPlan(null)}
        />
      )}
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-8">
              <CreditCard className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl sm:text-4xl font-black text-white">Subscription</h1>
              <Badge variant={currentPlan === "FREE" ? "secondary" : "default"}>
                {currentPlan}
              </Badge>
            </div>

            {successParam === "true" && (
              <div className="mb-6 p-4 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-300 font-medium">
                  Subscription activated! Enjoy your new plan.
                </p>
              </div>
            )}

            {/* Current plan */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-white mb-1">{currentPlan}</div>
                    <div className="text-sm text-[rgb(130,130,150)]">
                      {currentPlan === "FREE"
                        ? "Upgrade to unlock more features"
                        : "Thank you for supporting Communiclaw!"}
                    </div>
                  </div>
                  {currentPlan !== "FREE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelSubscription}
                      disabled={cancelling}
                      className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                    >
                      {cancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      Cancel Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan comparison */}
            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = currentPlan === plan.key;
                const isHigher =
                  PLANS.findIndex((p) => p.key === plan.key) >
                  PLANS.findIndex((p) => p.key === currentPlan);

                return (
                  <div
                    key={plan.key}
                    className={`rounded-2xl p-6 border ${
                      isCurrent
                        ? "border-purple-500 bg-purple-600/10"
                        : "border-[rgb(40,40,55)] bg-[rgb(16,16,22)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs py-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-3xl sm:text-5xl font-black text-white">{plan.price}</span>
                      <span className="text-[rgb(130,130,150)] pb-0.5 text-sm">/{plan.period}</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[rgb(200,200,210)]">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {plan.key === "FREE" ? (
                      <Button variant="secondary" className="w-full" disabled>
                        {isCurrent ? "Current Plan" : "Free"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant={isCurrent ? "secondary" : "gradient"}
                          className="w-full"
                          disabled={isCurrent || loading !== null}
                          onClick={() => subscribe(plan.key as "PRO" | "ELITE")}
                        >
                          {loading === plan.key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isCurrent ? (
                            "Current Plan"
                          ) : isHigher ? (
                            `Upgrade to ${plan.name}`
                          ) : (
                            `Downgrade to ${plan.name}`
                          )}
                        </Button>
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            className="w-full gap-2 border-[rgb(60,60,80)] text-[rgb(180,180,200)] hover:border-purple-500/50 hover:text-white text-sm"
                            onClick={() => setCryptoPayPlan(plan.key)}
                          >
                            <Bitcoin className="w-4 h-4 text-orange-400" />
                            Pay with Crypto (BTC/SOL)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense>
      <SubscriptionContent />
    </Suspense>
  );
}
