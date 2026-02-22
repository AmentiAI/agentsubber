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

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, slug: true, logoUrl: true, chain: true, ownerUserId: true } },
        _count: { select: { entries: true, winners: true } },
        roleMultipliers: true,
        winners: {
          include: {
            entry: {
              include: { user: { select: { id: true, name: true, xHandle: true } } },
            },
          },
        },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ giveaway });
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

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { community: { select: { ownerUserId: true, id: true } } },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (giveaway.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      prize,
      totalWinners,
      chain,
      status: requestedStatus,
      startAt,
      endAt,
      requiresXFollow,
      xAccountToFollow,
      requiresXRetweet,
      xTweetToRetweet,
      requiresXLike,
      xTweetToLike,
      requiresXTag,
      xTagsRequired,
      requiresDiscord,
      discordGuildId,
      requiredDiscordRole,
      requiresTelegram,
      telegramGroup,
      isPrivate,
      hideEntryCount,
      teamSpots,
      isAgentEligible,
      roleMultipliers,
    } = body;

    // Update with transaction for role multipliers
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.giveaway.update({
        where: { id },
        data: {
          title,
          description,
          prize,
          totalWinners: totalWinners ? Number(totalWinners) : undefined,
          chain,
          status: requestedStatus,
          startAt: startAt ? new Date(startAt) : undefined,
          endAt: endAt ? new Date(endAt) : undefined,
          requiresXFollow,
          xAccountToFollow,
          requiresXRetweet,
          xTweetToRetweet,
          requiresXLike,
          xTweetToLike,
          requiresXTag,
          xTagsRequired,
          requiresDiscord,
          discordGuildId,
          requiredDiscordRole,
          requiresTelegram,
          telegramGroup,
          isPrivate,
          hideEntryCount,
          teamSpots: teamSpots ? Number(teamSpots) : undefined,
          isAgentEligible,
        },
      });

      // Update role multipliers (delete all and recreate)
      if (roleMultipliers !== undefined) {
        await tx.roleMultiplier.deleteMany({ where: { giveawayId: id } });
        
        if (Array.isArray(roleMultipliers) && roleMultipliers.length > 0) {
          await tx.roleMultiplier.createMany({
            data: roleMultipliers
              .filter((r: any) => r.roleId && r.roleName)
              .map((r: any) => ({
                giveawayId: id,
                communityId: giveaway.community.id,
                roleId: r.roleId,
                roleName: r.roleName,
                multiplier: Number(r.multiplier) || 1,
              })),
          });
        }
      }

      return result;
    });

    // Fetch complete giveaway with relations
    const completeGiveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        roleMultipliers: true,
        community: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ giveaway: completeGiveaway });
  } catch (error: any) {
    console.error("[Giveaway Update Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { community: { select: { ownerUserId: true } } },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (giveaway.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.giveaway.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
