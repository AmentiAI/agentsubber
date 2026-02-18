import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const chain = searchParams.get("chain");

    const where: any = {};
    if (start && end) {
      where.mintDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    } else {
      where.mintDate = { gte: new Date() };
    }
    if (chain) where.chain = chain;

    const events = await prisma.mintCalendarEvent.findMany({
      where,
      include: {
        community: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
      orderBy: { mintDate: "asc" },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { communityId, mintDate, mintPrice, mintPriceToken, chain, spotsAvailable, mintUrl, description } = body;

    // Verify user owns the community
    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found or not authorized" }, { status: 403 });
    }

    const event = await prisma.mintCalendarEvent.create({
      data: {
        communityId,
        mintDate: new Date(mintDate),
        mintPrice: mintPrice ? Number(mintPrice) : null,
        mintPriceToken,
        chain: chain ?? community.chain,
        spotsAvailable: spotsAvailable ? Number(spotsAvailable) : null,
        mintUrl,
        description,
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
