import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

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
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }
    if (giveaway.status !== "ACTIVE") {
      return NextResponse.json({ error: "Giveaway is not active" }, { status: 400 });
    }
    if (new Date(giveaway.endAt) < new Date()) {
      return NextResponse.json({ error: "Giveaway has ended" }, { status: 400 });
    }

    // Check already entered
    const existing = await prisma.giveawayEntry.findUnique({
      where: {
        giveawayId_userId: { giveawayId: id, userId: session.user.id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Already entered" }, { status: 409 });
    }

    // Get user's primary wallet
    const primaryWallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id, isPrimary: true },
    });

    const body = await request.json().catch(() => ({}));

    const entry = await prisma.giveawayEntry.create({
      data: {
        giveawayId: id,
        userId: session.user.id,
        walletId: primaryWallet?.id,
        walletAddress: body.walletAddress ?? primaryWallet?.address,
        xUsername: body.xUsername,
        discordUsername: body.discordUsername,
        enteredByAgent: false,
      },
    });

    // Pusher: broadcast live entry count (best-effort, never fail the request)
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET) {
      try {
        const count = await prisma.giveawayEntry.count({ where: { giveawayId: id } });
        await getPusherServer()
          .trigger(CHANNELS.giveaway(id), EVENTS.ENTRY_COUNT, { count })
          .catch(() => {});
      } catch {
        // Pusher not configured — ignore
      }
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("[giveaway/enter] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}
