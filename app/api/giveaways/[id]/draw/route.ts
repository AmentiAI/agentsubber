import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { postWinnerAnnouncement } from "@/lib/discord";

export async function POST(
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
      where: { id: id },
      include: {
        community: {
          select: {
            ownerUserId: true,
            name: true,
            slug: true,
            discordIntegration: true,
          },
        },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }
    if (giveaway.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    if (giveaway.status === "COMPLETED") {
      return NextResponse.json({ error: "Already drawn" }, { status: 400 });
    }

    // Get all entries that haven't won yet
    const entries = await prisma.giveawayEntry.findMany({
      where: { giveawayId: id, winner: null },
      include: { user: { select: { id: true, name: true, xHandle: true } } },
    });

    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries" }, { status: 400 });
    }

    const numWinners = Math.min(giveaway.totalWinners, entries.length);

    // Fisher-Yates shuffle
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const winnerEntries = shuffled.slice(0, numWinners);

    // Create winner records
    const winners = await prisma.$transaction([
      ...winnerEntries.map((entry) =>
        prisma.giveawayWinner.create({
          data: {
            giveawayId: id,
            entryId: entry.id,
            userId: entry.userId,
          },
          include: {
            entry: {
              include: { user: { select: { id: true, name: true, xHandle: true } } },
            },
          },
        })
      ),
      prisma.giveaway.update({
        where: { id: id },
        data: { status: "COMPLETED" },
      }),
    ]);

    // Create notifications for winners
    for (const entry of winnerEntries) {
      await prisma.notification.create({
        data: {
          userId: entry.userId,
          title: "You won a giveaway! 🎉",
          message: `Congratulations! You won the "${giveaway.title}" giveaway. Prize: ${giveaway.prize}`,
          type: "WIN",
          link: `/c/${giveaway.community.slug}/giveaways/${id}`,
        },
      }).catch(() => {});
    }

    const formattedWinners = winners.slice(0, -1).map((w: any) => ({
      id: w.id,
      user: w.entry.user,
      walletAddress: w.entry.walletAddress,
      drawnAt: w.drawnAt,
    }));

    // ─── Pusher: broadcast winners to everyone watching this giveaway page ───
    if (process.env.PUSHER_APP_ID) {
      try {
        await getPusherServer().trigger(
          CHANNELS.giveaway(id),
          EVENTS.DRAW_COMPLETE,
          { winners: formattedWinners, giveawayId: id }
        );
      } catch (err) {
        console.error("[Pusher] trigger failed:", err);
      }
    }

    // ─── Discord: post winner announcement ───
    if (giveaway.community.discordIntegration?.winnerChannelId) {
      postWinnerAnnouncement({
        channelId: giveaway.community.discordIntegration.winnerChannelId,
        giveawayTitle: giveaway.title,
        winners: winnerEntries.map((e) => ({
          xHandle: e.user.xHandle,
          name: e.user.name,
          walletAddress: e.walletAddress,
        })),
        communityName: giveaway.community.name,
      }).catch(() => {});
    }

    return NextResponse.json({ winners: formattedWinners });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
