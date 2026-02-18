import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");
    const type = searchParams.get("type") ?? "inbox"; // inbox | outbox

    if (!communityId) {
      return NextResponse.json({ error: "communityId required" }, { status: 400 });
    }

    // Verify ownership
    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const where =
      type === "inbox"
        ? { toCommunityId: communityId }
        : { fromCommunityId: communityId };

    const collabs = await prisma.collabOffer.findMany({
      where,
      include: {
        fromCommunity: { select: { id: true, name: true, slug: true, logoUrl: true } },
        toCommunity: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ collabs });
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
    const { fromCommunityId, toCommunityId, spotsOffered, message, campaignId, expiresAt } = body;

    if (!fromCommunityId || !toCommunityId || !spotsOffered) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership of fromCommunity
    const fromCommunity = await prisma.community.findFirst({
      where: { id: fromCommunityId, ownerUserId: session.user.id },
    });
    if (!fromCommunity) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const toCommunity = await prisma.community.findUnique({
      where: { id: toCommunityId },
    });
    if (!toCommunity) {
      return NextResponse.json({ error: "Target community not found" }, { status: 404 });
    }

    const collab = await prisma.collabOffer.create({
      data: {
        fromCommunityId,
        toCommunityId,
        spotsOffered: Number(spotsOffered),
        message,
        campaignId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "PENDING",
      },
    });

    // Notify target community owner
    await prisma.notification.create({
      data: {
        userId: toCommunity.ownerUserId,
        title: "New Collab Offer",
        message: `${fromCommunity.name} wants to collab with ${toCommunity.name} — ${spotsOffered} spots offered.`,
        type: "COLLAB",
        link: `/dashboard/collabs`,
      },
    }).catch(() => {});

    return NextResponse.json({ collab }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { collabId, status } = body;

    if (!collabId || !["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const collab = await prisma.collabOffer.findUnique({
      where: { id: collabId },
      include: {
        toCommunity: true,
        fromCommunity: { select: { ownerUserId: true, name: true } },
      },
    });

    if (!collab) {
      return NextResponse.json({ error: "Collab not found" }, { status: 404 });
    }
    if (collab.toCommunity.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updated = await prisma.collabOffer.update({
      where: { id: collabId },
      data: { status },
    });

    // Notify sender
    await prisma.notification.create({
      data: {
        userId: collab.fromCommunity.ownerUserId,
        title: `Collab ${status === "ACCEPTED" ? "Accepted" : "Declined"}`,
        message: `${collab.toCommunity.name} ${status === "ACCEPTED" ? "accepted" : "declined"} your collab offer.`,
        type: "COLLAB",
      },
    }).catch(() => {});

    return NextResponse.json({ collab: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
