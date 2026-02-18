import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";

export async function GET() {
  const messages = await (prisma as any).chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          xHandle: true,
          image: true,
          subscription: { select: { plan: true } },
          ownedCommunities: { select: { name: true, slug: true }, take: 1 },
        },
      },
    },
  });
  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim() || content.length > 500) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const message = await (prisma as any).chatMessage.create({
    data: { userId: session.user.id, content: content.trim() },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          xHandle: true,
          image: true,
          subscription: { select: { plan: true } },
          ownedCommunities: { select: { name: true, slug: true }, take: 1 },
        },
      },
    },
  });

  try {
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET) {
      const pusher = getPusherServer();
      await pusher.trigger("global-chat", "message", message);
    }
  } catch {}

  return NextResponse.json({ message });
}
