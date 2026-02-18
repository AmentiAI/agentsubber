"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, Crown, Star } from "lucide-react";
import { useSession } from "next-auth/react";

const PLANS = [
  {
    name: "FREE",
    price: 0,
    icon: <Star className="w-7 h-7 text-[rgb(130,130,150)]" />,
    desc: "For individuals getting started",
    color: "border-[rgb(50,50,65)]",
    badge: null,
    features: [
      "1 community",
      "3 giveaways/month",
      "1 allowlist campaign",
      "Basic analytics",
      "Public feed & discover",
      "Solana & BTC wallet connect",
    ],
    cta: "Get Started",
    href: "/login",
    variant: "outline" as const,
  },
  {
    name: "PRO",
    price: 9.99,
    icon: <Zap className="w-7 h-7 text-purple-400" />,
    desc: "For serious community builders",
    color: "border-purple-500/50",
    badge: "Most Popular",
    features: [
      "5 communities",
      "Unlimited giveaways",
      "Unlimited allowlists",
      "Presale launches",
      "Collab requests",
      "Discord webhook integration",
      "2× giveaway entry multiplier",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/dashboard/subscription",
    variant: "gradient" as const,
  },
  {
    name: "ELITE",
    price: 29.99,
    icon: <Crown className="w-7 h-7 text-yellow-400" />,
    desc: "For power users & agencies",
    color: "border-yellow-500/40",
    badge: "Best Value",
    features: [
      "Unlimited communities",
      "Unlimited everything",
      "Wallet tracker alerts",
      "Agent-powered auto-enter",
      "Custom accent colors",
      "Collab marketplace priority",
      "3× giveaway entry multiplier",
      "Dedicated support",
    ],
    cta: "Go Elite",
    href: "/dashboard/subscription",
    variant: "gradient" as const,
  },
];

const FAQ = [
  { q: "Can I pay with crypto?", a: "Yes — PRO and ELITE plans accept SOL and BTC in addition to card via Stripe." },
  { q: "Can I upgrade or downgrade anytime?", a: "Absolutely. You keep your current plan until the billing period ends, then the new plan kicks in." },
  { q: "What is the giveaway multiplier?", a: "Pro users get 2× entries per giveaway, Elite users get 3×. It increases your odds of winning." },
  { q: "Do I need a wallet to use Communiclaw?", a: "No — you can use most features without one. A wallet is required to enter giveaways or allowlists." },
  { q: "Is there a free trial?", a: "The FREE plan is free forever. Pro and Elite have no trial, but you can cancel anytime." },
];

export default function PricingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[rgb(10,10,15)]">
      <Navbar />

      {/* Hero */}
      <div className="text-center pt-20 pb-14 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />Simple, transparent pricing
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
          Build your <span className="text-gradient">Web3 community</span>
        </h1>
        <p className="text-xl text-[rgb(140,140,165)] max-w-xl mx-auto">
          Start free. Scale when you're ready. Pay with card or crypto.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={`relative border-2 ${plan.color} ${plan.name === "PRO" ? "scale-[1.02] shadow-purple-500/20 shadow-2xl" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className={`text-xs font-bold px-4 py-1 rounded-full ${plan.name === "PRO" ? "bg-purple-600 text-white" : "bg-yellow-500 text-black"}`}>
                    {plan.badge}
                  </span>
                </div>
              )}
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  {plan.icon}
                  <span className="text-lg font-black text-white">{plan.name}</span>
                </div>
                <div className="mb-2">
                  {plan.price === 0 ? (
                    <span className="text-5xl font-black text-white">Free</span>
                  ) : (
                    <span className="text-5xl font-black text-white">${plan.price}<span className="text-xl font-normal text-[rgb(130,130,150)]">/mo</span></span>
                  )}
                </div>
                <p className="text-sm text-[rgb(130,130,150)] mb-8">{plan.desc}</p>

                <Link href={session ? plan.href : "/login"}>
                  <Button variant={plan.variant} className="w-full mb-8 h-12 text-base">
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[rgb(200,200,215)]">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Crypto payment callout */}
        <div className="mb-20 p-8 rounded-2xl bg-gradient-to-r from-orange-900/20 to-purple-900/20 border border-[rgb(60,60,80)] text-center">
          <div className="text-3xl mb-3">₿ ◎</div>
          <h3 className="text-2xl font-black text-white mb-2">Pay with BTC or SOL</h3>
          <p className="text-[rgb(150,150,170)]">All plans accept Bitcoin and Solana payments. Connect your wallet and pay on-chain.</p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-10">FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border border-[rgb(40,40,55)] bg-[rgb(14,14,22)] overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-semibold hover:bg-[rgb(20,20,30)] transition-colors list-none">
                  {item.q}
                  <span className="text-purple-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
                </summary>
                <div className="px-6 pb-5 text-[rgb(160,160,180)] text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
