"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Twitter,
  CheckCircle,
  Loader2,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { truncateAddress } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", bio: "" });

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setForm({
            username: data.user.username ?? "",
            bio: data.user.bio ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, ...data.user }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error ?? "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-purple-400" />
                      Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* X Account */}
                    <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[rgb(20,20,28)] border border-sky-500/20">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[rgb(30,30,40)] shrink-0">
                        {user?.xProfilePic ? (
                          <img src={user.xProfilePic} alt={user.xHandle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Twitter className="w-5 h-5 text-sky-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {user?.name ?? "X Account"}
                        </p>
                        {user?.xHandle && (
                          <p className="text-xs text-sky-400">@{user.xHandle}</p>
                        )}
                        {user?.xFollowerCount && (
                          <p className="text-xs text-[rgb(130,130,150)]">
                            {user.xFollowerCount.toLocaleString()} followers
                          </p>
                        )}
                      </div>
                      <Badge variant="success" className="gap-1 shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </Badge>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <label className="text-xs text-[rgb(130,130,150)] mb-1 block">
                          Username
                        </label>
                        <Input
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          placeholder="your_username"
                          maxLength={32}
                        />
                        <p className="text-xs text-[rgb(100,100,120)] mt-1">
                          Used for your profile URL. Lowercase letters, numbers, and underscores only.
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-[rgb(130,130,150)] mb-1 block">Bio</label>
                        <Textarea
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          placeholder="Tell the community about yourself..."
                          rows={3}
                          maxLength={200}
                        />
                        <p className="text-xs text-[rgb(100,100,120)] mt-1 text-right">
                          {form.bio.length}/200
                        </p>
                      </div>
                      {error && (
                        <p className="text-sm text-red-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <Button type="submit" variant="gradient" disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                        {saved && (
                          <span className="text-sm text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Saved!
                          </span>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Account */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      Account Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[rgb(130,130,150)]">User ID</span>
                      <span className="text-white font-mono text-xs">{user?.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgb(130,130,150)]">Email</span>
                      <span className="text-white">{user?.email ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgb(130,130,150)]">Plan</span>
                      <Badge variant={
                        user?.subscription?.plan === "ELITE"
                          ? "sol"
                          : user?.subscription?.plan === "PRO"
                          ? "secondary"
                          : "secondary"
                      }>
                        {user?.subscription?.plan ?? "FREE"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgb(130,130,150)]">Member since</span>
                      <span className="text-white">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    {user?.wallets?.length > 0 && (
                      <div className="pt-2 border-t border-[rgb(40,40,55)]">
                        <p className="text-[rgb(130,130,150)] mb-2">Connected Wallets</p>
                        {user.wallets.map((w: any) => (
                          <div key={w.id} className="flex items-center justify-between py-1">
                            <span className="font-mono text-xs text-white">{truncateAddress(w.address)}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={w.chain === "SOL" ? "sol" : "btc"} className="text-xs">
                                {w.chain}
                              </Badge>
                              {w.isPrimary && (
                                <Badge variant="success" className="text-xs">Primary</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
