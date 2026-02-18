import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWebhook } from "@/lib/discord";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { communityId, webhookUrl, giveawayChannelId, winnerChannelId } = await req.json();

  // Verify ownership
  const community = await prisma.community.findFirst({
    where: { id: communityId, ownerUserId: session.user.id },
    select: { id: true, name: true },
  });
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

  // Upsert integration
  const integration = await prisma.discordIntegration.upsert({
    where: { communityId },
    create: { communityId, guildId: "webhook", webhookUrl, giveawayChannelId, winnerChannelId },
    update: { webhookUrl, giveawayChannelId, winnerChannelId },
  });

  return NextResponse.json({ integration });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { communityId } = await req.json();
  const community = await prisma.community.findFirst({
    where: { id: communityId, ownerUserId: session.user.id },
  });
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.discordIntegration.deleteMany({ where: { communityId } });
  return NextResponse.json({ ok: true });
}
