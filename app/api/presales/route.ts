import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { postPresaleAnnouncement } from "@/lib/discord";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const communityId = url.searchParams.get("communityId");
    const mine = url.searchParams.get("mine") === "true";

    let where: any = {};
    if (communityId) {
      where.communityId = communityId;
    } else if (mine && session?.user?.id) {
      // Return presales for communities owned by this user
      where.community = { ownerUserId: session.user.id };
    } else {
      where.status = "ACTIVE";
    }

    const presales = await prisma.presale.findMany({
      where,
      include: {
        community: { select: { id: true, name: true, slug: true, chain: true } },
      },
      orderBy: { startsAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ presales });
  } catch {
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
      name,
      description,
      priceSOL,
      priceBTC,
      totalSupply,
      maxPerWallet = 1,
      startsAt,
      endsAt,
      allowlistRequired = false,
      campaignId,
    } = body as {
      communityId: string;
      name: string;
      description?: string;
      priceSOL?: number;
      priceBTC?: number;
      totalSupply: number;
      maxPerWallet?: number;
      startsAt: string;
      endsAt: string;
      allowlistRequired?: boolean;
      campaignId?: string;
    };

    if (!communityId || !name || !totalSupply || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "Missing required fields: communityId, name, totalSupply, startsAt, endsAt" },
        { status: 400 }
      );
    }

    if (!priceSOL && !priceBTC) {
      return NextResponse.json(
        { error: "At least one price (SOL or BTC) is required" },
        { status: 400 }
      );
    }

    // Verify user owns the community
    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found or access denied" },
        { status: 403 }
      );
    }

    // Determine initial status based on start time
    const now = new Date();
    const startDate = new Date(startsAt);
    const status = startDate <= now ? "ACTIVE" : "DRAFT";

    const presale = await prisma.presale.create({
      data: {
        communityId,
        name,
        description,
        priceSOL,
        priceBTC,
        totalSupply,
        maxPerWallet,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        allowlistRequired,
        campaignId: allowlistRequired ? campaignId : null,
        status,
      },
    });

    // Discord announcement
    const discordInt = await prisma.discordIntegration.findFirst({
      where: { communityId },
      include: { community: { select: { logoUrl: true, slug: true, name: true } } },
    });
    if (discordInt?.webhookUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentsubber.vercel.app";
      postPresaleAnnouncement({
        webhookUrl: discordInt.webhookUrl,
        presaleName: name,
        priceSOL: priceSOL ?? null,
        priceBTC: priceBTC ?? null,
        totalSupply,
        entryUrl: `${appUrl}/c/${discordInt.community?.slug}/presale/${presale.id}`,
        communityName: discordInt.community?.name ?? community.name,
        logoUrl: discordInt.community?.logoUrl,
      }).catch(() => {});
    }

    return NextResponse.json({ presale }, { status: 201 });
  } catch (err) {
    console.error("Create presale error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
