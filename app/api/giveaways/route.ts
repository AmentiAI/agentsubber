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
        roleMultipliers: true,
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
      chain,
      status: requestedStatus,
      startAt,
      endAt,
      
      // Twitter
      requiresXFollow,
      xAccountToFollow,
      requiresXRetweet,
      xTweetToRetweet,
      requiresXLike,
      xTweetToLike,
      requiresXTag,
      xTagsRequired,
      
      // Discord
      requiresDiscord,
      discordGuildId,
      requiredDiscordRole,
      
      // Telegram
      requiresTelegram,
      telegramGroup,
      
      // Token gating
      tokenGateAddress,
      tokenGateAmount,
      
      // Privacy
      isPrivate,
      hideEntryCount,
      teamSpots,
      
      // Agent
      isAgentEligible,
      
      // Role multipliers
      roleMultipliers,
    } = body;

    if (!communityId || !title || !prize || !startAt || !endAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const community = await prisma.community.findFirst({
      where: { id: communityId, ownerUserId: session.user.id },
    });
    if (!community) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Determine status based on start time and requested status
    const now = new Date();
    const start = new Date(startAt);
    const end = new Date(endAt);
    
    let giveawayStatus = requestedStatus || "DRAFT";
    if (requestedStatus === "ACTIVE") {
      if (start <= now && end > now) {
        giveawayStatus = "ACTIVE";
      } else if (start > now) {
        giveawayStatus = "UPCOMING";
      }
    }

    // Create giveaway with transaction for role multipliers
    const giveaway = await prisma.$transaction(async (tx) => {
      const created = await tx.giveaway.create({
        data: {
          communityId,
          title,
          description,
          prize,
          totalWinners: totalWinners ?? 1,
          chain: chain || community.chain || "SOL",
          status: giveawayStatus,
          startAt: start,
          endAt: end,
          
          // Twitter
          requiresXFollow: requiresXFollow ?? false,
          xAccountToFollow,
          requiresXRetweet: requiresXRetweet ?? false,
          xTweetToRetweet,
          requiresXLike: requiresXLike ?? false,
          xTweetToLike,
          requiresXTag: requiresXTag ?? false,
          xTagsRequired,
          
          // Discord
          requiresDiscord: requiresDiscord ?? false,
          discordGuildId,
          requiredDiscordRole,
          
          // Telegram
          requiresTelegram: requiresTelegram ?? false,
          telegramGroup,
          
          // Token gating
          tokenGateAddress,
          tokenGateAmount: tokenGateAmount ? Number(tokenGateAmount) : null,
          
          // Privacy
          isPrivate: isPrivate ?? false,
          hideEntryCount: hideEntryCount ?? false,
          teamSpots: teamSpots ? Number(teamSpots) : null,
          
          // Agent
          isAgentEligible: isAgentEligible ?? true,
        },
      });

      // Create role multipliers if provided
      if (roleMultipliers && Array.isArray(roleMultipliers) && roleMultipliers.length > 0) {
        await tx.roleMultiplier.createMany({
          data: roleMultipliers
            .filter((r: any) => r.roleId && r.roleName && r.multiplier)
            .map((r: any) => ({
              giveawayId: created.id,
              communityId,
              roleId: r.roleId,
              roleName: r.roleName,
              multiplier: Number(r.multiplier) || 1,
            })),
        });
      }

      return created;
    });

    // Discord: announce giveaway via webhook if community has integration and giveaway is active
    if (giveawayStatus === "ACTIVE" || giveawayStatus === "UPCOMING") {
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
          endAt: end,
          entryUrl: `${appUrl}/c/${community.slug}/giveaways/${giveaway.id}`,
          communityName: community.name,
          logoUrl: integration.community?.logoUrl,
        }).catch(() => {});
      }
    }

    // Fetch complete giveaway with relations
    const completeGiveaway = await prisma.giveaway.findUnique({
      where: { id: giveaway.id },
      include: {
        roleMultipliers: true,
      },
    });

    return NextResponse.json({ giveaway: completeGiveaway }, { status: 201 });
  } catch (error: any) {
    console.error("[Giveaway Create Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
