import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });
  if (content.trim().length > 500) return NextResponse.json({ error: "Comment too long (max 500 chars)" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await prisma.postComment.create({
    data: { postId, userId: session.user.id, content: content.trim() },
    include: {
      user: { select: { id: true, name: true, xHandle: true, xProfilePic: true, image: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const { commentId } = await req.json();

  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== postId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.postComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
