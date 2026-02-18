import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeEntries = searchParams.get("entries") === "true";

    const campaign = await prisma.allowlistCampaign.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, slug: true, chain: true, ownerUserId: true } },
        ...(includeEntries && {
          entries: {
            include: { user: { select: { id: true, name: true, xHandle: true } } },
            orderBy: { createdAt: "asc" },
          },
        }),
        _count: { select: { entries: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
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

    const campaign = await prisma.allowlistCampaign.findUnique({
      where: { id },
      include: { community: { select: { ownerUserId: true } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (campaign.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await prisma.allowlistCampaign.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
