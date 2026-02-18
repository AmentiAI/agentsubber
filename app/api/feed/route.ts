import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const POST_INCLUDE = {
  user: { select: { id: true, name: true, xHandle: true, xProfilePic: true, image: true } },
  community: { select: { id: true, name: true, slug: true, logoUrl: true, logoPosition: true, accentColor: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    take: 50,
    include: {
      user: { select: { id: true, name: true, xHandle: true, xProfilePic: true, image: true } },
    },
  },
  likes: { select: { userId: true } },
  _count: { select: { comments: true, likes: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const communitySlug = searchParams.get("community");
  const limit = 20;

  const where: any = {};
  if (communitySlug) {
    where.community = { slug: communitySlug };
  }

  const posts = await prisma.post.findMany({
    where,
    include: POST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ posts: items, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { content, communityId, imageUrl } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: "Post too long (max 2000 chars)" }, { status: 400 });
  }

  // Verify community ownership if communityId provided
  if (communityId) {
    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found or not yours" }, { status: 403 });
    }
  }

  const post = await prisma.post.create({
    data: {
      userId: session.user.id,
      content: content.trim(),
      communityId: communityId || null,
      imageUrl: imageUrl || null,
    },
    include: POST_INCLUDE,
  });

  return NextResponse.json({ post }, { status: 201 });
}
