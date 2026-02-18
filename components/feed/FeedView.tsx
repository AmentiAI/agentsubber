"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
  Upload,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export type PostUser = {
  id: string;
  name: string | null;
  xHandle: string | null;
  xProfilePic: string | null;
  image: string | null;
};
export type PostCommunity = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  logoPosition: string | null;
  accentColor: string | null;
};
export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
};
export type Post = {
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

/* ── Avatar ── */
export function Avatar({ user, size = 10 }: { user: PostUser; size?: number }) {
  const src = user.xProfilePic ?? user.image;
  const initials = (user.name ?? user.xHandle ?? "?")[0].toUpperCase();
  const px = size * 4; // tailwind unit → px approx
  if (src) {
    return (
      <img
        src={src}
        alt={user.name ?? ""}
        className="rounded-full object-cover shrink-0"
        style={{ width: size * 4, height: size * 4 }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 text-sm"
      style={{ width: size * 4, height: size * 4 }}
    >
      {initials}
    </div>
  );
}

/* ── Community Badge ── */
export function CommunityBadge({ community, linked = true }: { community: PostCommunity; linked?: boolean }) {
  const accent = community.accentColor ?? "#8B5CF6";
  const inner = (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-opacity hover:opacity-80 cursor-pointer"
      style={{ color: accent, borderColor: `${accent}50`, backgroundColor: `${accent}18` }}
    >
      {community.logoUrl && (
        <img
          src={community.logoUrl}
          alt=""
          className="rounded-full object-cover"
          style={{ width: 14, height: 14, objectPosition: community.logoPosition ?? "50% 50%" }}
        />
      )}
      {community.name}
    </span>
  );
  return linked ? <Link href={`/c/${community.slug}`}>{inner}</Link> : inner;
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

/* ── Post Card ── */
export function PostCard({
  post,
  currentUserId,
  onDelete,
  onLike,
  onComment,
  onDeleteComment,
  hideCommunityBadge = false,
}: {
  post: Post;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onComment: (postId: string, content: string) => Promise<Comment | null>;
  onDeleteComment: (postId: string, commentId: string) => void;
  hideCommunityBadge?: boolean;
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
      const newComment = await onComment(post.id, commentText.trim());
      if (newComment) setLocalComments((prev) => [...prev, newComment]);
      setCommentText("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const name = post.user.name ?? (post.user.xHandle ? `@${post.user.xHandle}` : "Anonymous");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
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
                {!hideCommunityBadge && post.community && (
                  <CommunityBadge community={post.community} />
                )}
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
              {localLikeCount > 0 && <span>{localLikeCount}</span>}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[rgb(100,100,120)] hover:text-purple-400 hover:bg-purple-900/15 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {localComments.length > 0 && <span>{localComments.length}</span>}
              {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="border-t border-[rgb(30,30,40)] bg-[rgb(12,12,18)]">
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

/* ── Composer ── */
export function PostComposer({
  user,
  fixedCommunity,
  communities,
  onPost,
  placeholder = "What's on your mind?",
}: {
  user: any;
  fixedCommunity?: PostCommunity;
  communities?: PostCommunity[];
  onPost: (post: Post) => void;
  placeholder?: string;
}) {
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState<string>(fixedCommunity?.id ?? communities?.[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxChars = 2000;
  const remaining = maxChars - content.length;

  const handleImageFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("Image too large (max 8 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

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
        body: JSON.stringify({
          content,
          communityId: communityId || null,
          imageUrl: imageUrl || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onPost(data.post);
        setContent("");
        setImageUrl("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } finally {
      setSubmitting(false);
    }
  };

  const userObj: PostUser = {
    id: user.id ?? "",
    name: user.name ?? null,
    xHandle: (user as any).xHandle ?? null,
    xProfilePic: null,
    image: user.image ?? null,
  };

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
                placeholder={placeholder}
                rows={3}
                className="w-full bg-transparent text-white text-base placeholder:text-[rgb(70,70,90)] focus:outline-none resize-none leading-relaxed"
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden border border-[rgb(40,40,55)]">
                  <img src={imagePreview} alt="preview" className="w-full max-h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(""); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
              />

              {/* Community row — fixed if community board, picker if global */}
              {fixedCommunity ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[rgb(100,100,120)]">Posting to</span>
                  <CommunityBadge community={fixedCommunity} linked={false} />
                </div>
              ) : communities && communities.length > 0 ? (
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
              ) : null}

              <div className="flex items-center justify-between pt-2 border-t border-[rgb(30,30,40)]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg transition-colors ${imagePreview ? "text-purple-400 bg-purple-900/20" : "text-[rgb(100,100,120)] hover:text-purple-400 hover:bg-purple-900/15"}`}
                  title="Attach image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  {content.length > maxChars * 0.8 && (
                    <span className={`text-xs font-mono ${remaining < 50 ? "text-red-400" : "text-[rgb(100,100,120)]"}`}>
                      {remaining}
                    </span>
                  )}
                  <Button type="submit" variant="gradient" size="sm" disabled={!content.trim() || remaining < 0 || submitting} className="px-6">
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

/* ── FeedView — shared feed logic ── */
export default function FeedView({
  communitySlug,
  communityId,
  community,
  hideCommunityBadge = false,
}: {
  communitySlug?: string;
  communityId?: string;
  community?: PostCommunity;
  hideCommunityBadge?: boolean;
}) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userCommunities, setUserCommunities] = useState<PostCommunity[]>([]);

  const fetchPosts = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (communitySlug) params.set("community", communitySlug);
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/feed?${params}`);
    return res.json();
  }, [communitySlug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchPosts();
      setPosts(data.posts ?? []);
      setNextCursor(data.nextCursor);
      setLoading(false);
    })();
  }, [fetchPosts]);

  useEffect(() => {
    if (!session?.user || communityId) return; // community board uses fixed communityId
    fetch("/api/communities?mine=true")
      .then((r) => r.json())
      .then((d) => setUserCommunities(d.communities ?? []))
      .catch(() => {});
  }, [session, communityId]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchPosts(nextCursor);
    setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    setNextCursor(data.nextCursor);
    setLoadingMore(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/feed/${postId}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLike = async (postId: string) => {
    await fetch(`/api/feed/${postId}/like`, { method: "POST" });
  };

  const handleComment = async (postId: string, content: string): Promise<Comment | null> => {
    const res = await fetch(`/api/feed/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    return data.comment ?? null;
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    await fetch(`/api/feed/${postId}/comment`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
  };

  const userObj = session?.user;

  return (
    <div>
      {/* Composer */}
      {userObj ? (
        <PostComposer
          user={userObj}
          fixedCommunity={community}
          communities={!community ? userCommunities : undefined}
          onPost={(post) => setPosts((prev) => [post, ...prev])}
          placeholder={community ? `Post in ${community.name}…` : "What's happening?"}
        />
      ) : (
        <Card className="mb-6 border-purple-500/20">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <p className="text-[rgb(180,180,200)]">Sign in to post and engage</p>
            <Link href="/login">
              <Button variant="gradient" className="shrink-0">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-[rgb(100,100,120)]">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-bold text-[rgb(150,150,170)] mb-2">No posts yet</p>
          <p>{community ? `Be the first to post in ${community.name}!` : "Be the first to post!"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userObj?.id}
              onDelete={handleDelete}
              onLike={handleLike}
              onComment={handleComment}
              onDeleteComment={handleDeleteComment}
              hideCommunityBadge={hideCommunityBadge}
            />
          ))}
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore} className="gap-2">
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
