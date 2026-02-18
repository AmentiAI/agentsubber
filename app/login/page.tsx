"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  List,
  Bot,
  Wallet,
  Shield,
  ArrowRight,
  Twitter,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  { icon: Gift, text: "Enter giveaways & win prizes" },
  { icon: List, text: "Secure NFT allowlist spots" },
  { icon: Wallet, text: "Connect Solana & Bitcoin wallets" },
  { icon: Bot, text: "Register your OpenClaw AI agent" },
  { icon: Shield, text: "Token-gated community access" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-[rgb(10,10,15)] p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold pulse-glow">
              C
            </div>
            <span className="font-bold text-xl text-white">
              Communi<span className="text-purple-400">claw</span>
            </span>
          </Link>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            The Web3 Community
            <br />
            <span className="gradient-text">Platform That Works</span>
          </h2>
          <p className="text-[rgb(130,130,150)] text-lg mb-12 leading-relaxed">
            Everything you need to manage NFT communities — allowlists,
            giveaways, presales, collabs, and AI agent support.
          </p>

          <ul className="space-y-4">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-center gap-3 text-[rgb(200,200,210)]">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-purple-400" />
                  </div>
                  {item.text}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative mt-auto">
          <div className="flex items-center gap-4 text-sm text-[rgb(130,130,150)]">
            <div className="flex -space-x-2">
              {["#8B5CF6", "#6366F1", "#0EA5E9", "#10B981"].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[rgb(10,10,15)]"
                  style={{ background: color }}
                />
              ))}
            </div>
            Join thousands of Web3 community builders
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="font-bold text-xl text-white">
                Communi<span className="text-purple-400">claw</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              Sign in required
            </Badge>
            <h1 className="text-3xl font-bold text-white mb-2">
              Connect with X to continue
            </h1>
            <p className="text-[rgb(130,130,150)]">
              Sign in with your X (Twitter) account to access all Communiclaw features.
            </p>
          </div>

          {/* Sign in button */}
          <div className="space-y-3 mb-8">
            <Button
              onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
              variant="gradient"
              size="lg"
              className="w-full gap-3 text-base"
            >
              <Twitter className="w-5 h-5" />
              Sign in with X (Twitter)
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgb(40,40,55)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-[rgb(130,130,150)] bg-[rgb(10,10,15)]">
                or
              </span>
            </div>
          </div>

          <Link href="/discover">
            <Button variant="outline" size="lg" className="w-full">
              Continue as Guest
            </Button>
          </Link>

          <p className="text-xs text-[rgb(130,130,150)] text-center mt-8 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            We only access your public X profile — no posting on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
