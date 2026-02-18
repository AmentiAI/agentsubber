import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
