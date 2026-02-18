"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Key,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Activity,
  Loader2,
  Eye,
  EyeOff,
  Power,
} from "lucide-react";

interface Agent {
  id: string;
  agentName: string;
  apiKey: string;
  permissions: string[];
  isActive: boolean;
  lastActiveAt: string | null;
  requestCount: number;
  activity: Array<{
    id: string;
    action: string;
    createdAt: string;
  }>;
}

export default function AgentPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((data) => setAgent(data.agent ?? null))
      .finally(() => setLoading(false));
  }, []);

  async function registerAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!agentName.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName }),
      });
      const data = await res.json();
      if (res.ok) {
        setAgent(data.agent);
        setShowKey(true);
      }
    } finally {
      setRegistering(false);
    }
  }

  async function toggleActive() {
    if (!agent) return;
    setToggling(true);
    try {
      const res = await fetch("/api/agent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });
      const data = await res.json();
      if (res.ok) setAgent(data.agent);
    } finally {
      setToggling(false);
    }
  }

  async function regenerateKey() {
    if (!confirm("Regenerating the API key will immediately invalidate your current key. Your agent will need to be updated. Continue?")) return;
    const res = await fetch("/api/agent", { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setAgent((a) => a ? { ...a, apiKey: data.apiKey } : null);
      setShowKey(true);
    }
  }

  function copyKey() {
    if (!agent) return;
    navigator.clipboard.writeText(agent.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const maskedKey = agent
    ? `cl_${"•".repeat(24)}${agent.apiKey.slice(-8)}`
    : "";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <Bot className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">My OpenClaw Agent</h1>
              <Badge variant="secondary">1 per account</Badge>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
              </div>
            ) : !agent ? (
              /* Registration form */
              <div className="space-y-6">
                <Card className="border-purple-500/30 bg-purple-600/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-600/30 flex items-center justify-center shrink-0">
                        <Bot className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold mb-1">Register Your OpenClaw Agent</h2>
                        <p className="text-sm text-[rgb(130,130,150)] leading-relaxed">
                          Connect your OpenClaw (formerly Moltbot) agent to Communiclaw. Your agent gets
                          a unique API key to auto-enter giveaways, browse allowlists, and discover
                          communities on your behalf — 24/7.
                        </p>
                      </div>
                    </div>

                    <ul className="grid grid-cols-2 gap-2 mb-6">
                      {[
                        "Auto-enter eligible giveaways",
                        "Submit wallet to allowlists",
                        "Browse communities",
                        "Read your notifications",
                        "Full activity log",
                        "Rate limited (100 req/min)",
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[rgb(200,200,210)]">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Register Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={registerAgent} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-1.5">
                          Agent Name
                        </label>
                        <Input
                          required
                          placeholder="e.g. My OpenClaw Bot"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                        />
                        <p className="text-xs text-[rgb(130,130,150)] mt-1.5">
                          A label to identify this agent in your activity log.
                        </p>
                      </div>
                      <Button type="submit" variant="gradient" disabled={registering} className="gap-2">
                        {registering ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                        Register Agent
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Agent dashboard */
              <div className="space-y-6">
                {/* Agent card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-white font-semibold text-lg">{agent.agentName}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={agent.isActive ? "success" : "secondary"}>
                              {agent.isActive ? "Active" : "Paused"}
                            </Badge>
                            <span className="text-xs text-[rgb(130,130,150)]">
                              {agent.requestCount.toLocaleString()} requests made
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleActive}
                        disabled={toggling}
                        className="gap-2"
                      >
                        {toggling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                        {agent.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>

                    {/* API Key */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-2 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5" />
                        API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2.5 rounded-lg bg-[rgb(10,10,15)] border border-[rgb(40,40,55)] text-sm font-mono text-[rgb(200,200,210)] truncate">
                          {showKey ? agent.apiKey : maskedKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowKey(!showKey)}
                          title={showKey ? "Hide key" : "Show key"}
                        >
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={copyKey}
                          title="Copy key"
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-[rgb(130,130,150)] mt-1.5">
                        Add this key to your OpenClaw config as{" "}
                        <code className="text-purple-400">X-Agent-Key</code> header.
                      </p>
                    </div>

                    {/* Permissions */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[rgb(200,200,210)] mb-2">
                        Permissions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {agent.permissions.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">
                            {p.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-[rgb(40,40,55)]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateKey}
                        className="gap-2 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate Key
                      </Button>
                      <div className="flex items-center gap-1 text-xs text-[rgb(130,130,150)] ml-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Invalidates current key immediately
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* OpenClaw config snippet */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">OpenClaw Skill Config</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-[rgb(10,10,15)] border border-[rgb(40,40,55)] text-xs font-mono text-[rgb(200,200,210)] overflow-x-auto leading-relaxed">
{`# Add to your OpenClaw skills config:
name: communiclaw
description: Auto-enter giveaways and allowlists on Communiclaw
auth:
  type: api_key
  header: X-Agent-Key
  value: ${showKey ? agent.apiKey : maskedKey}
base_url: ${typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "https://agentsubber.vercel.app")}/api/agent`}
                    </pre>
                  </CardContent>
                </Card>

                {/* Recent activity */}
                {agent.activity && agent.activity.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-purple-400" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {agent.activity.slice(0, 10).map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <span className="text-[rgb(200,200,210)]">
                                {a.action.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </div>
                            <span className="text-xs text-[rgb(130,130,150)]">
                              {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
