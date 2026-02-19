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
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-7 h-7 text-purple-400" />
              <h1 className="text-3xl sm:text-5xl font-black text-white">Settings</h1>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {/* Profile */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-purple-400" />
                      Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {/* X Account */}
                    <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl bg-[rgb(16,16,24)] border border-sky-500/20">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[rgb(30,30,40)] shrink-0">
                        {user?.xProfilePic ? (
                          <img src={user.xProfilePic} alt={user.xHandle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Twitter className="w-7 h-7 text-sky-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-bold text-white mb-0.5">
                          {user?.name ?? "X Account"}
                        </p>
                        {user?.xHandle && (
                          <p className="text-sm text-sky-400">@{user.xHandle}</p>
                        )}
                        {user?.xFollowerCount && (
                          <p className="text-xs text-[rgb(130,130,150)] mt-0.5">
                            {user.xFollowerCount.toLocaleString()} followers
                          </p>
                        )}
                      </div>
                      <Badge variant="success" className="gap-1.5 px-3 py-1.5 text-sm shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Connected
                      </Badge>
                    </div>

                    <form onSubmit={handleSave} className="space-y-5">
                      <div>
                        <label className="text-sm font-medium text-[rgb(180,180,200)] mb-2 block">
                          Username
                        </label>
                        <Input
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          placeholder="your_username"
                          maxLength={32}
                          className="h-12 text-base"
                        />
                        <p className="text-xs text-[rgb(100,100,120)] mt-1.5">
                          Used for your profile URL. Lowercase letters, numbers, and underscores only.
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[rgb(180,180,200)] mb-2 block">Bio</label>
                        <Textarea
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          placeholder="Tell the community about yourself..."
                          rows={4}
                          maxLength={200}
                          className="text-base resize-none"
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
                      <div className="flex items-center gap-4">
                        <Button type="submit" variant="gradient" disabled={saving} className="h-11 px-8 text-base">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                        {saved && (
                          <span className="text-sm text-green-400 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            Saved!
                          </span>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      Account Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[rgb(16,16,24)] border border-[rgb(35,35,50)]">
                        <div className="text-xs text-[rgb(120,120,140)] mb-1">User ID</div>
                        <div className="text-sm text-white font-mono break-all">{user?.id}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-[rgb(16,16,24)] border border-[rgb(35,35,50)]">
                        <div className="text-xs text-[rgb(120,120,140)] mb-1">Email</div>
                        <div className="text-sm text-white">{user?.email ?? "—"}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-[rgb(16,16,24)] border border-[rgb(35,35,50)]">
                        <div className="text-xs text-[rgb(120,120,140)] mb-1">Plan</div>
                        <Badge variant={user?.subscription?.plan === "ELITE" ? "sol" : user?.subscription?.plan === "PRO" ? "secondary" : "secondary"} className="text-sm px-3 py-1">
                          {user?.subscription?.plan ?? "FREE"}
                        </Badge>
                      </div>
                      <div className="p-4 rounded-xl bg-[rgb(16,16,24)] border border-[rgb(35,35,50)]">
                        <div className="text-xs text-[rgb(120,120,140)] mb-1">Member since</div>
                        <div className="text-sm text-white">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                        </div>
                      </div>
                    </div>

                    {user?.wallets?.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-[rgb(35,35,50)]">
                        <p className="text-sm font-medium text-[rgb(180,180,200)] mb-3">Connected Wallets</p>
                        <div className="space-y-2">
                          {user.wallets.map((w: any) => (
                            <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(16,16,24)] border border-[rgb(35,35,50)]">
                              <span className="font-mono text-sm text-white">{truncateAddress(w.address)}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={w.chain === "SOL" ? "sol" : "btc"} className="text-xs">{w.chain}</Badge>
                                {w.isPrimary && <Badge variant="success" className="text-xs">Primary</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
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
