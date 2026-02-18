"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FollowButton({ communityId, followerCount }: { communityId: string; followerCount?: number }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(followerCount ?? 0);

  useEffect(() => {
    if (!session?.user) { setLoading(false); return; }
    fetch(`/api/communities/${communityId}/follow`)
      .then(r => r.json())
      .then(d => setFollowing(d.following ?? false))
      .finally(() => setLoading(false));
  }, [communityId, session]);

  const toggle = async () => {
    if (!session?.user) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/follow`, { method: "POST" });
      const d = await res.json();
      setFollowing(d.following);
      setCount(c => d.following ? c + 1 : Math.max(0, c - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? "secondary" : "gradient"}
      size="lg"
      onClick={toggle}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
       following ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
      {following ? "Following" : "Follow"}
      {count > 0 && <span className="ml-1 text-xs opacity-70">· {count}</span>}
    </Button>
  );
}
