"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Handshake,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface CollabItem {
  id: string;
  status: string;
  spotsOffered: number;
  message: string | null;
  createdAt: string;
  fromCommunity: { id: string; name: string; slug: string };
  toCommunity: { id: string; name: string; slug: string };
}

interface CommunityWithCollabs {
  id: string;
  name: string;
  slug: string;
  inbox: CollabItem[];
  outbox: CollabItem[];
}

export default function CollabsPage() {
  const [communities, setCommunities] = useState<CommunityWithCollabs[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mineRes = await fetch("/api/communities/mine");
        const mineData = await mineRes.json();
        const mine = mineData.communities ?? [];

        const withCollabs = await Promise.all(
          mine.map(async (c: any) => {
            const [inboxRes, outboxRes] = await Promise.all([
              fetch(`/api/collab?communityId=${c.id}&type=inbox`),
              fetch(`/api/collab?communityId=${c.id}&type=outbox`),
            ]);
            const [inboxData, outboxData] = await Promise.all([
              inboxRes.json(),
              outboxRes.json(),
            ]);
            return {
              ...c,
              inbox: inboxData.collabs ?? [],
              outbox: outboxData.collabs ?? [],
            };
          })
        );

        setCommunities(withCollabs);
      } catch {
        // network error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRespond = async (collabId: string, status: "ACCEPTED" | "DECLINED") => {
    setResponding(collabId);
    try {
      const res = await fetch("/api/collab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collabId, status }),
      });
      if (res.ok) {
        setCommunities((prev) =>
          prev.map((c) => ({
            ...c,
            inbox: c.inbox.map((col) =>
              col.id === collabId ? { ...col, status } : col
            ),
          }))
        );
      }
    } finally {
      setResponding(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
    if (status === "ACCEPTED") return <Badge variant="success">Accepted</Badge>;
    if (status === "DECLINED") return <Badge variant="secondary">Declined</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const totalPending = communities.reduce(
    (sum, c) => sum + c.inbox.filter((col) => col.status === "PENDING").length,
    0
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-full px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-8">
              <Handshake className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Collabs</h1>
              {totalPending > 0 && (
                <Badge variant="live">{totalPending} pending</Badge>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : communities.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-4">
                  <Handshake className="w-8 h-8 text-[rgb(130,130,150)]" />
                </div>
                <h3 className="text-white font-semibold mb-2">No communities yet</h3>
                <p className="text-[rgb(130,130,150)] text-sm mb-4">
                  Create a community to start sending and receiving collab offers.
                </p>
                <Link href="/dashboard/communities/new">
                  <Button variant="gradient">Create Community</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {communities.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {c.name[0].toUpperCase()}
                      </div>
                      <h2 className="text-lg font-bold text-white">{c.name}</h2>
                      <Link href={`/c/${c.slug}/manage?tab=collabs`}>
                        <Button variant="ghost" size="sm" className="text-xs text-[rgb(130,130,150)]">
                          Manage →
                        </Button>
                      </Link>
                    </div>

                    {c.inbox.length === 0 && c.outbox.length === 0 ? (
                      <div className="text-sm text-[rgb(130,130,150)] pl-9">
                        No collab offers yet for this community.
                      </div>
                    ) : (
                      <div className="grid lg:grid-cols-2 gap-6 pl-9">
                        {/* Inbox */}
                        <div>
                          <h3 className="text-xs font-semibold text-[rgb(130,130,150)] uppercase tracking-wider mb-3">
                            Inbox ({c.inbox.length})
                          </h3>
                          {c.inbox.length === 0 ? (
                            <p className="text-sm text-[rgb(100,100,120)]">No incoming offers</p>
                          ) : (
                            <div className="space-y-3">
                              {c.inbox.map((col) => (
                                <Card key={col.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <Users className="w-3.5 h-3.5 text-purple-400" />
                                          <Link
                                            href={`/c/${col.fromCommunity.slug}`}
                                            className="text-sm font-semibold text-white hover:text-purple-300"
                                          >
                                            {col.fromCommunity.name}
                                          </Link>
                                        </div>
                                        <p className="text-xs text-purple-400 mt-0.5">
                                          {col.spotsOffered} spots offered
                                        </p>
                                      </div>
                                      {statusBadge(col.status)}
                                    </div>
                                    {col.message && (
                                      <p className="text-xs text-[rgb(180,180,200)] mb-3 bg-[rgb(20,20,28)] p-2 rounded-lg">
                                        {col.message}
                                      </p>
                                    )}
                                    {col.status === "PENDING" && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="gradient"
                                          className="flex-1 text-xs"
                                          disabled={responding === col.id}
                                          onClick={() => handleRespond(col.id, "ACCEPTED")}
                                        >
                                          {responding === col.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <>
                                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                              Accept
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="flex-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                          disabled={responding === col.id}
                                          onClick={() => handleRespond(col.id, "DECLINED")}
                                        >
                                          <XCircle className="w-3.5 h-3.5 mr-1" />
                                          Decline
                                        </Button>
                                      </div>
                                    )}
                                    {col.status === "ACCEPTED" && (
                                      <div className="flex items-center gap-1.5 text-xs text-green-400">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Accepted — coordinate via Discord to complete the collab
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Outbox */}
                        <div>
                          <h3 className="text-xs font-semibold text-[rgb(130,130,150)] uppercase tracking-wider mb-3">
                            Sent ({c.outbox.length})
                          </h3>
                          {c.outbox.length === 0 ? (
                            <p className="text-sm text-[rgb(100,100,120)]">No sent offers</p>
                          ) : (
                            <div className="space-y-3">
                              {c.outbox.map((col) => (
                                <Card key={col.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-[rgb(130,130,150)]">To:</span>
                                          <Link
                                            href={`/c/${col.toCommunity.slug}`}
                                            className="text-sm font-semibold text-white hover:text-purple-300"
                                          >
                                            {col.toCommunity.name}
                                          </Link>
                                        </div>
                                        <p className="text-xs text-purple-400 mt-0.5">
                                          {col.spotsOffered} spots offered
                                        </p>
                                      </div>
                                      {statusBadge(col.status)}
                                    </div>
                                    {col.message && (
                                      <p className="text-xs text-[rgb(180,180,200)] mt-2 bg-[rgb(20,20,28)] p-2 rounded-lg">
                                        {col.message}
                                      </p>
                                    )}
                                    {col.status === "ACCEPTED" && (
                                      <div className="flex items-center gap-1.5 text-xs text-green-400 mt-2">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Accepted!
                                      </div>
                                    )}
                                    {col.status === "DECLINED" && (
                                      <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Declined
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
