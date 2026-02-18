"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type PostUser = { id: string; name: string | null; xHandle: string | null; xProfilePic: string | null; image: string | null };
type PostCommunity = { id: string; name: string; slug: string; logoUrl: string | null; logoPosition: string | null; accentColor: string | null };
type Comment = { id: string; content: string; createdAt: string; user: PostUser };
type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: PostUser;
  community: PostCommunity | null;
  comments: Comment[];
  likes: { userId: string }[];
  _count: { comments: number; likes: number };
};

function Avatar({ user, size = 10 }: { user: PostUser; size?: number }) {
  const src = user.xProfilePic ?? user.image;
  const initials = (user.name ?? user.xHandle ?? "?")[0].toUpperCase();
  const sizeClass = `w-${size} h-${size}`;
  if (src) {
    return <img src={src} alt={user.name ?? ""} className={`${sizeClass} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 text-sm`}>
      {initials}
    </div>
  );
}

function CommunityBadge({ community }: { community: PostCommunity }) {
  const accent = community.accentColor ?? "#8B5CF6";
  return (
    <Link href={`/c/${community.slug}`}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-opacity hover:opacity-80 cursor-pointer"
        style={{ color: accent, borderColor: `${accent}50`, backgroundColor: `${accent}18` }}
      >
        {community.logoUrl && (
          <img
            src={community.logoUrl}
            alt=""
            className="w-3.5 h-3.5 rounded-full object-cover"
            style={{ objectPosition: community.logoPosition ?? "50% 50%" }}
          />
        )}
        {community.name}
      </span>
    </Link>
  );
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

/* ─── Post Card ─── */
function PostCard({
  post,
  currentUserId,
  onDelete,
  onLike,
  onComment,
  onDeleteComment,
}: {
  post: Post;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localLiked, setLocalLiked] = useState(
    currentUserId ? post.likes.some((l) => l.userId === currentUserId) : false
  );
  const [localLikeCount, setLocalLikeCount] = useState(post._count.likes);
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments);

  const handleLike = () => {
    if (!currentUserId) return;
    setLocalLiked((p) => !p);
    setLocalLikeCount((c) => (localLiked ? c - 1 : c + 1));
    onLike(post.id);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await onComment(post.id, commentText.trim());
      // Refresh comments inline
      const res = await fetch(`/api/feed?cursor=&limit=1`);
      // Just optimistically add — parent will handle real refresh
      setLocalComments((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          content: commentText.trim(),
          createdAt: new Date().toISOString(),
          user: { id: currentUserId!, name: "You", xHandle: null, xProfilePic: null, image: null },
        },
      ]);
      setCommentText("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const name = post.user.name ?? (post.user.xHandle ? `@${post.user.xHandle}` : "Anonymous");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* ── Post body ── */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar user={post.user} size={11} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-base">{name}</span>
                {post.user.xHandle && (
                  <span className="text-sm text-[rgb(100,100,120)]">@{post.user.xHandle}</span>
                )}
                {post.community && <CommunityBadge community={post.community} />}
              </div>
              <p className="text-xs text-[rgb(90,90,110)] mt-0.5">{timeAgo(post.createdAt)}</p>
            </div>
            {currentUserId === post.user.id && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-1.5 rounded-lg text-[rgb(80,80,100)] hover:text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-[rgb(220,220,230)] text-base leading-relaxed whitespace-pre-wrap mb-4">
            {post.content}
          </p>

          {/* Image */}
          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden mb-4 border border-[rgb(35,35,50)]">
              <img src={post.imageUrl} alt="" className="w-full max-h-96 object-cover" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 -ml-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                localLiked
                  ? "text-red-400 bg-red-900/20"
                  : "text-[rgb(100,100,120)] hover:text-red-400 hover:bg-red-900/15"
              }`}
            >
              <Heart className={`w-4 h-4 ${localLiked ? "fill-current" : ""}`} />
              <span>{localLikeCount > 0 ? localLikeCount : ""}</span>
            </button>

            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[rgb(100,100,120)] hover:text-purple-400 hover:bg-purple-900/15 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{localComments.length > 0 ? localComments.length : ""}</span>
              {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* ── Comments ── */}
        {showComments && (
          <div className="border-t border-[rgb(30,30,40)] bg-[rgb(12,12,18)]">
            {/* Comment list */}
            {localComments.length > 0 && (
              <div className="px-6 pt-4 space-y-4">
                {localComments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 group">
                    <Avatar user={c.user} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-white">
                          {c.user.name ?? (c.user.xHandle ? `@${c.user.xHandle}` : "User")}
                        </span>
                        <span className="text-xs text-[rgb(80,80,100)]">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[rgb(200,200,215)] mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                    {currentUserId === c.user.id && (
                      <button
                        onClick={() => {
                          setLocalComments((prev) => prev.filter((x) => x.id !== c.id));
                          onDeleteComment(post.id, c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[rgb(80,80,100)] hover:text-red-400 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comment composer */}
            {currentUserId ? (
              <form onSubmit={handleComment} className="flex items-end gap-3 px-6 py-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  rows={1}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(20,20,28)] border border-[rgb(40,40,55)] text-white text-sm placeholder:text-[rgb(80,80,100)] focus:outline-none focus:border-purple-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment(e as any);
                    }
                  }}
                />
                <Button type="submit" variant="gradient" size="sm" disabled={!commentText.trim() || submittingComment} className="shrink-0">
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            ) : (
              <div className="px-6 py-4">
                <Link href="/login">
                  <Button variant="secondary" size="sm" className="w-full">Sign in to comment</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Post Composer ─── */
function PostComposer({
  user,
  communities,
  onPost,
}: {
  user: any;
  communities: PostCommunity[];
  onPost: (post: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState<string>(communities[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 2000;
  const remaining = maxChars - content.length;

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, communityId: communityId || null, imageUrl: imageUrl || null }),
      });
      const data = await res.json();
      if (res.ok) {
        onPost(data.post);
        setContent("");
        setImageUrl("");
        setShowImageInput(false);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } finally {
      setSubmitting(false);
    }
  };

  const userObj: PostUser = { id: user.id ?? "", name: user.name ?? null, xHandle: (user as any).xHandle ?? null, xProfilePic: null, image: user.image ?? null };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-4">
            <Avatar user={userObj} size={11} />
            <div className="flex-1 min-w-0 space-y-3">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => { setContent(e.target.value); autoResize(); }}
                placeholder="What's happening in your community?"
                rows={3}
                className="w-full bg-transparent text-white text-base placeholder:text-[rgb(70,70,90)] focus:outline-none resize-none leading-relaxed"
              />

              {/* Image URL input */}
              {showImageInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (image URL)"
                    className="flex-1 px-3 py-2 rounded-lg bg-[rgb(20,20,28)] border border-[rgb(40,40,55)] text-white text-sm placeholder:text-[rgb(70,70,90)] focus:outline-none focus:border-purple-500"
                  />
                  <button type="button" onClick={() => { setShowImageInput(false); setImageUrl(""); }}
                    className="p-2 rounded-lg text-[rgb(80,80,100)] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Community picker */}
              {communities.length > 0 && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[rgb(100,100,120)] shrink-0" />
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="bg-transparent text-sm text-[rgb(140,140,160)] focus:outline-none cursor-pointer"
                  >
                    <option value="">No community</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[rgb(20,20,28)]">{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bottom row */}
              <div className="flex items-center justify-between pt-2 border-t border-[rgb(30,30,40)]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowImageInput((v) => !v)}
                    className={`p-2 rounded-lg transition-colors ${showImageInput ? "text-purple-400 bg-purple-900/20" : "text-[rgb(100,100,120)] hover:text-purple-400 hover:bg-purple-900/15"}`}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {content.length > maxChars * 0.8 && (
                    <span className={`text-xs font-mono ${remaining < 50 ? "text-red-400" : "text-[rgb(100,100,120)]"}`}>
                      {remaining}
                    </span>
                  )}
                  <Button
                    type="submit"
                    variant="gradient"
                    size="sm"
                    disabled={!content.trim() || remaining < 0 || submitting}
                    className="px-6"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Main Feed Page ─── */
export default function FeedPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userCommunities, setUserCommunities] = useState<PostCommunity[]>([]);

  const fetchPosts = useCallback(async (cursor?: string) => {
    const url = `/api/feed${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchPosts();
      setPosts(data.posts ?? []);
      setNextCursor(data.nextCursor);
      setLoading(false);
    })();
  }, [fetchPosts]);

  // Fetch user's communities for the composer
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/communities?mine=true")
      .then((r) => r.json())
      .then((d) => setUserCommunities(d.communities ?? []))
      .catch(() => {});
  }, [session]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchPosts(nextCursor);
    setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    setNextCursor(data.nextCursor);
    setLoadingMore(false);
  };

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/feed/${postId}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLike = async (postId: string) => {
    await fetch(`/api/feed/${postId}/like`, { method: "POST" });
  };

  const handleComment = async (postId: string, content: string) => {
    await fetch(`/api/feed/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    await fetch(`/api/feed/${postId}/comment`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
  };

  return (
    <div className="min-h-screen bg-[rgb(10,10,15)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white">Feed</h1>
            <p className="text-sm text-[rgb(100,100,120)] mt-1">Posts from all communities</p>
          </div>
        </div>

        {/* Composer */}
        {session?.user ? (
          <PostComposer
            user={session.user}
            communities={userCommunities}
            onPost={handleNewPost}
          />
        ) : (
          <Card className="mb-6 border-purple-500/20 bg-purple-600/8">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <p className="text-[rgb(180,180,200)]">Sign in to post and engage with the community</p>
              <Link href="/login">
                <Button variant="gradient" className="shrink-0">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-[rgb(100,100,120)]">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold text-[rgb(150,150,170)] mb-2">No posts yet</p>
            <p>Be the first to post something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session?.user?.id}
                onDelete={handleDelete}
                onLike={handleLike}
                onComment={handleComment}
                onDeleteComment={handleDeleteComment}
              />
            ))}

            {nextCursor && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
