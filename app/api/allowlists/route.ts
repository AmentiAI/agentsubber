import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postAllowlistAnnouncement } from "@/lib/discord";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");
    const status = searchParams.get("status") ?? "ACTIVE";

    const where: any = { status };
    if (communityId) where.communityId = communityId;

    const campaigns = await prisma.allowlistCampaign.findMany({
      where,
      include: {
        community: { select: { id: true, name: true, slug: true, chain: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { closesAt: "asc" },
    });

    return NextResponse.json({ campaigns });
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
    const { communityId, name, description, totalSpots, entryMethod, closesAt, chain } = body;

    if (!communityId || !name || !totalSpots) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const campaign = await prisma.allowlistCampaign.create({
      data: {
        communityId,
        name,
        description,
        totalSpots: Number(totalSpots),
        entryMethod: entryMethod ?? "FCFS",
        status: "ACTIVE",
        closesAt: closesAt ? new Date(closesAt) : null,
        chain: chain ?? community.chain,
      },
    });

    // Discord announcement
    const discordIntegration = await prisma.discordIntegration.findFirst({
      where: { communityId },
      include: { community: { select: { logoUrl: true } } },
    });
    if (discordIntegration?.webhookUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentsubber.vercel.app";
      postAllowlistAnnouncement({
        webhookUrl: discordIntegration.webhookUrl,
        campaignName: name,
        totalSpots: Number(totalSpots),
        entryMethod: entryMethod ?? "FCFS",
        entryUrl: `${appUrl}/c/${community.slug}/allowlist/${campaign.id}`,
        communityName: community.name,
        closesAt: closesAt ? new Date(closesAt) : null,
        logoUrl: discordIntegration.community?.logoUrl,
      }).catch(() => {});
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
