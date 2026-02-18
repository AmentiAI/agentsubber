"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  CreditCard,
  Zap,
  Crown,
  Star,
  Loader2,
  AlertTriangle,
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

function SubscriptionContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
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
      <div className="max-w-7xl mx-auto px-4 py-8">
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
