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
  Copy,
  Clock,
} from "lucide-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import Navbar from "@/components/layout/Navbar";

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

interface CryptoPayState {
  plan: string;
  chain: "BTC" | "SOL" | null;
  paymentId: string | null;
  amount: string | null;
  address: string | null;
  memo: string | null;
  loadingChain: "BTC" | "SOL" | null;
  verifying: boolean;
  verifyResult: { confirmed: boolean; pending?: boolean; message?: string; error?: string; txHash?: string } | null;
}

function CryptoPayPanel({ plan, onClose }: { plan: string; onClose: () => void }) {
  const [state, setState] = useState<CryptoPayState>({
    plan,
    chain: null,
    paymentId: null,
    amount: null,
    address: null,
    memo: null,
    loadingChain: null,
    verifying: false,
    verifyResult: null,
  });
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");

  async function selectChain(chain: "BTC" | "SOL") {
    setState(s => ({ ...s, loadingChain: chain, verifyResult: null }));
    try {
      const res = await fetch("/api/billing/crypto-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, chain }),
      });
      const data = await res.json();
      if (res.ok) {
        setState(s => ({
          ...s,
          chain,
          paymentId: data.payment.id,
          amount: data.amount,
          address: data.address,
          memo: data.memo,
          loadingChain: null,
        }));
      } else {
        setState(s => ({ ...s, loadingChain: null }));
        alert(data.error ?? "Failed to create payment");
      }
    } catch {
      setState(s => ({ ...s, loadingChain: null }));
    }
  }

  async function verifyPayment() {
    if (!state.paymentId || !txHash.trim()) return;
    setState(s => ({ ...s, verifying: true, verifyResult: null }));
    try {
      const res = await fetch("/api/billing/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: state.paymentId, txHash: txHash.trim() }),
      });
      const data = await res.json();
      setState(s => ({ ...s, verifying: false, verifyResult: data }));
    } catch {
      setState(s => ({ ...s, verifying: false, verifyResult: { confirmed: false, error: "Network error. Please try again." } }));
    }
  }

  function copyAddr() {
    if (state.address) {
      navigator.clipboard.writeText(state.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[rgb(16,16,22)] border border-[rgb(40,40,55)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(40,40,55)]">
          <div className="text-base font-bold text-white">Pay with Crypto — {plan}</div>
          <button onClick={onClose} className="text-[rgb(130,130,150)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Chain selector */}
          {!state.chain && (
            <div>
              <div className="text-sm text-[rgb(130,130,150)] mb-3">Select payment chain:</div>
              <div className="grid grid-cols-2 gap-3">
                {(["BTC", "SOL"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => selectChain(c)}
                    disabled={state.loadingChain !== null}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:border-purple-500/50 ${
                      c === "BTC" ? "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400" : "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {state.loadingChain === c ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <span className="text-2xl">{c === "BTC" ? "₿" : "◎"}</span>
                    )}
                    <span className="text-sm font-bold">{c === "BTC" ? "Bitcoin" : "Solana"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment details */}
          {state.chain && state.amount && state.address && (
            <>
              <div className="bg-[rgb(20,20,28)] rounded-xl p-5 border border-[rgb(40,40,55)]">
                <div className="text-xs text-[rgb(130,130,150)] mb-1">Send exactly</div>
                <div className="text-2xl font-black text-white mb-4">{state.amount} {state.chain}</div>
                <div className="text-xs text-[rgb(130,130,150)] mb-1">To address</div>
                <div className="font-mono text-sm text-white bg-[rgb(30,30,40)] p-3 rounded-lg break-all mb-3">{state.address}</div>
                <Button onClick={copyAddr} variant="secondary" size="sm" className="w-full">
                  {copied ? <><CheckCircle className="w-3.5 h-3.5 mr-1 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy Address</>}
                </Button>
                <div className="text-xs text-[rgb(130,130,150)] mt-3 text-center">
                  ⚡ Send the exact amount shown — each payment has a unique amount for tracking
                </div>
              </div>

              {/* TX Hash input */}
              {!state.verifyResult?.confirmed && (
                <div>
                  <label className="block text-xs font-medium text-[rgb(200,200,210)] mb-1.5">
                    After sending, paste your transaction hash here:
                  </label>
                  <Input
                    placeholder="Paste your transaction hash/ID here..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {/* Verify result */}
              {state.verifyResult && (
                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  state.verifyResult.confirmed
                    ? "bg-green-500/10 border border-green-500/20 text-green-300"
                    : state.verifyResult.pending
                    ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}>
                  {state.verifyResult.confirmed ? (
                    <><CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>Payment confirmed! Your {plan} plan is now active. TX: {state.verifyResult.txHash?.slice(0, 16)}...</span></>
                  ) : state.verifyResult.pending ? (
                    <><Clock className="w-4 h-4 shrink-0 mt-0.5" /><span>{state.verifyResult.message ?? "Transaction found, waiting for confirmation. Check back in 1-2 minutes."}</span></>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{state.verifyResult.error ?? "Could not verify transaction."}</span></>
                  )}
                </div>
              )}

              {!state.verifyResult?.confirmed && (
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={verifyPayment}
                  disabled={state.verifying || !txHash.trim()}
                >
                  {state.verifying ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying on-chain...</>
                  ) : (
                    "Verify Payment"
                  )}
                </Button>
              )}

              <button
                onClick={() => { setState(s => ({ ...s, chain: null, paymentId: null, amount: null, address: null, memo: null, verifyResult: null })); setTxHash(""); }}
                className="w-full text-xs text-[rgb(130,130,150)] hover:text-white text-center"
              >
                ← Change chain
              </button>
            </>
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
      if (data.url) window.location.href = data.url;
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
              <h1 className="text-4xl font-black text-white">Subscription</h1>
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
                      <span className="text-5xl font-black text-white">{plan.price}</span>
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
