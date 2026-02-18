import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { postGiveawayAnnouncement } from "@/lib/discord";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");
    const status = searchParams.get("status") ?? "ACTIVE";

    const where: any = { status };
    if (communityId) where.communityId = communityId;

    const giveaways = await prisma.giveaway.findMany({
      where,
      include: {
        community: { select: { id: true, name: true, slug: true, logoUrl: true, chain: true } },
        _count: { select: { entries: true, winners: true } },
      },
      orderBy: { endAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ giveaways });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      communityId,
      title,
      description,
      prize,
      totalWinners,
      startAt,
      endAt,
      requiresXFollow,
      xAccountToFollow,
      requiresDiscord,
      tokenGateAddress,
      tokenGateAmount,
      isAgentEligible,
    } = body;

    if (!communityId || !title || !prize || !endAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const giveaway = await prisma.giveaway.create({
      data: {
        communityId,
        title,
        description,
        prize,
        totalWinners: totalWinners ?? 1,
        status: new Date(startAt ?? Date.now()) <= new Date() ? "ACTIVE" : "UPCOMING",
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: new Date(endAt),
        requiresXFollow: requiresXFollow ?? false,
        xAccountToFollow,
        requiresDiscord: requiresDiscord ?? false,
        tokenGateAddress,
        tokenGateAmount: tokenGateAmount ? Number(tokenGateAmount) : null,
        isAgentEligible: isAgentEligible ?? true,
      },
    });

    // Discord: announce giveaway via webhook if community has integration
    const integration = await prisma.discordIntegration.findFirst({
      where: { communityId },
      include: { community: { select: { logoUrl: true } } },
    });
    if (integration?.webhookUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentsubber.vercel.app";
      postGiveawayAnnouncement({
        webhookUrl: integration.webhookUrl,
        giveawayTitle: title,
        prize,
        winners: totalWinners ?? 1,
        endAt: new Date(endAt),
        entryUrl: `${appUrl}/c/${community.slug}/giveaways/${giveaway.id}`,
        communityName: community.name,
        logoUrl: integration.community?.logoUrl,
      }).catch(() => {});
    }

    return NextResponse.json({ giveaway }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
