import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, xHandle: true, avatarUrl: true } },
        memberAccess: true,
        _count: {
          select: {
            giveaways: true,
            allowlistCampaigns: true,
            presales: true,
          },
        },
        giveaways: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { _count: { select: { entries: true, winners: true } } },
        },
        allowlistCampaigns: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { _count: { select: { entries: true } } },
        },
        presales: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ community });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const community = await prisma.community.findFirst({
      where: { id, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await prisma.community.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        twitterHandle: body.twitterHandle,
        discordInvite: body.discordInvite,
        telegramLink: body.telegramLink,
        websiteUrl: body.websiteUrl,
      },
    });

    return NextResponse.json({ community: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
