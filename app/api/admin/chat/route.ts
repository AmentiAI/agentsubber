import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // ChatMessage schema: id, userId, content, createdAt
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, xHandle: true, image: true } } },
  });

  return NextResponse.json({ messages });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { messageId } = await req.json();
  await prisma.chatMessage.delete({ where: { id: messageId } });
  return NextResponse.json({ ok: true });
}
