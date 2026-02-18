import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gift,
  List,
  ShoppingBag,
  Handshake,
  Bot,
  Wallet,
  Eye,
  Calendar,
  Shield,
  CheckCircle,
  ArrowRight,
  Bitcoin,
} from "lucide-react";

const FEATURES = [
  {
    icon: List,
    title: "Allowlist Management",
    description:
      "Create and manage pre-mint allowlists with FCFS or raffle entry methods. Full lifecycle management in one dashboard.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Gift,
    title: "Giveaways & Raffles",
    description:
      "Run fair, transparent raffles with animated winner draws. Require X follows, Discord, or NFT ownership for entry.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    icon: Handshake,
    title: "Community Collabs",
    description:
      "Send collab offers to partner communities. Share allowlist spots and grow your audience together.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: ShoppingBag,
    title: "Presales",
    description:
      "Launch token presales gated by allowlist. Accept SOL or BTC payments directly from community members.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Shield,
    title: "Token Gating",
    description:
      "Gate community access by NFT ownership, SPL token balance, Discord role, or any combination.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Bot,
    title: "AI Agent Access",
    description:
      "Connect your OpenClaw agent (1 per human) to auto-enter giveaways, track allowlists, and never miss a drop.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: Eye,
    title: "Wallet Tracker",
    description:
      "Monitor any Solana or Bitcoin wallet in real-time. Get instant alerts on transactions and snipe attempts.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Calendar,
    title: "Mint Calendar",
    description:
      "Browse upcoming NFT mints across all chains. Never miss a drop with the global mint calendar.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "1 community",
      "3 active giveaways",
      "1 allowlist campaign",
      "X & wallet connect",
      "1 OpenClaw agent",
      "Community discovery",
    ],
    cta: "Get Started Free",
    highlighted: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "For serious community builders",
    features: [
      "5 communities",
      "Unlimited giveaways",
      "Unlimited allowlists",
      "Collab system",
      "Presales",
      "2x giveaway multiplier",
      "Priority support",
    ],
    cta: "Start Pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    price: "$24.99",
    period: "per month",
    description: "Unlimited power for pros",
    features: [
      "Unlimited communities",
      "Everything in Pro",
      "Wallet tracker & alerts",
      "Analytics dashboard",
      "3x giveaway multiplier",
      "Community verification badge",
      "Discord bot integration",
    ],
    cta: "Go Elite",
    highlighted: false,
    badge: "Best Value",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <Badge variant="default" className="mb-6 inline-flex gap-2 px-4 py-1.5 text-sm">
            <Bot className="w-3.5 h-3.5" />
            Now with OpenClaw AI Agent Support
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            The Web3 Community
            <br />
            <span className="gradient-text">Platform Built to Win</span>
          </h1>

          <p className="text-lg sm:text-xl text-[rgb(130,130,150)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage allowlists, run fair giveaways, launch presales, collaborate
            with other communities, and let your AI agent do the work — all in
            one professional platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/login">
              <Button variant="gradient" size="xl" className="w-full sm:w-auto gap-2">
                Connect with X &amp; Launch
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Explore Communities
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-[rgb(130,130,150)]">
            <span>Supported chains:</span>
            <div className="flex items-center gap-1 chain-sol font-semibold">
              <span className="text-lg">◎</span> Solana
            </div>
            <div className="flex items-center gap-1 chain-btc font-semibold">
              <Bitcoin className="w-4 h-4" /> Bitcoin Ordinals
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Platform Features</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Run a Web3 Community
            </h2>
            <p className="text-[rgb(130,130,150)] text-lg max-w-2xl mx-auto">
              Built on everything Subber had — allowlists, giveaways, collabs, presales —
              plus AI agents, Ordinals support, and a modern professional UX.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="card-hover p-1">
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-[rgb(130,130,150)] leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* OpenClaw highlight */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-2xl p-8 lg:p-12 glow-purple">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 gap-2">
                  <Bot className="w-3.5 h-3.5" />
                  OpenClaw Integration
                </Badge>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Let Your AI Agent
                  <br />
                  <span className="gradient-text">Work While You Sleep</span>
                </h2>
                <p className="text-[rgb(130,130,150)] mb-6 leading-relaxed">
                  Register your OpenClaw (formerly Moltbot) agent with your
                  Communiclaw account. One agent per human — your agent gets a
                  dedicated API key to browse communities, enter giveaways, and
                  submit allowlist entries on your behalf.
                </p>
                <ul className="space-y-2 mb-8">
                  {[
                    "Auto-enter eligible giveaways",
                    "Submit wallet to open allowlists",
                    "Browse and discover communities",
                    "Receive notification feeds",
                    "Full activity log in your dashboard",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[rgb(200,200,210)]">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/agent">
                  <Button variant="gradient" className="gap-2">
                    <Bot className="w-4 h-4" />
                    Register Your Agent
                  </Button>
                </Link>
              </div>

              <div className="rounded-xl bg-[rgb(10,10,15)] border border-[rgb(40,40,55)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgb(40,40,55)]">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-[rgb(130,130,150)] font-mono">
                    communiclaw.skill.yaml
                  </span>
                </div>
                <pre className="p-4 text-xs font-mono text-[rgb(200,200,210)] overflow-x-auto leading-relaxed">
{`name: communiclaw
description: Manage Web3 communities
  on Communiclaw platform
version: "1.0"
auth:
  type: api_key
  header: X-Agent-Key
endpoints:
  - GET  /api/agent/giveaways
  - POST /api/agent/giveaways/:id/enter
  - GET  /api/agent/allowlists
  - POST /api/agent/allowlists/:id/enter
  - GET  /api/agent/communities
  - GET  /api/agent/notifications
rate_limit: 100 req/min`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-[rgb(130,130,150)] text-lg">
              Start free. Upgrade when you&apos;re ready to scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border ${
                  plan.highlighted
                    ? "border-purple-500 bg-purple-600/10 glow-purple"
                    : "border-[rgb(40,40,55)] bg-[rgb(16,16,22)]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant={plan.highlighted ? "default" : "secondary"}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-[rgb(130,130,150)] pb-1">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-[rgb(130,130,150)]">{plan.description}</p>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-[rgb(200,200,210)]">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/login">
                  <Button
                    variant={plan.highlighted ? "gradient" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Build Your Community?
          </h2>
          <p className="text-[rgb(130,130,150)] text-lg mb-8">
            Connect your X account and your Solana or Bitcoin wallet to get started in
            under 2 minutes.
          </p>
          <Link href="/login">
            <Button variant="gradient" size="xl" className="gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgb(40,40,55)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  C
                </div>
                <span className="font-bold text-white">
                  Communi<span className="text-purple-400">claw</span>
                </span>
              </div>
              <p className="text-xs text-[rgb(130,130,150)] leading-relaxed">
                The professional Web3 community management platform.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-[rgb(130,130,150)]">
                <li><Link href="/discover" className="hover:text-white transition-colors">Discover</Link></li>
                <li><Link href="/calendar" className="hover:text-white transition-colors">Mint Calendar</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">For Builders</h4>
              <ul className="space-y-2 text-sm text-[rgb(130,130,150)]">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/agent" className="hover:text-white transition-colors">Agent API</Link></li>
                <li><Link href="/docs/agent" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-[rgb(130,130,150)]">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter/X</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[rgb(40,40,55)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[rgb(130,130,150)]">
              &copy; {new Date().getFullYear()} Communiclaw. All rights reserved.
            </p>
            <p className="text-xs text-[rgb(130,130,150)]">
              Supporting Solana ◎ &amp; Bitcoin ₿ Ordinals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
