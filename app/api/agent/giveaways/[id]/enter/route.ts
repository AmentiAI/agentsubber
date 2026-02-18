import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent, logAgentActivity } from "@/lib/openclaw";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: "Invalid or missing agent key" }, { status: 401 });
  }

  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: id },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }
    if (giveaway.status !== "ACTIVE") {
      return NextResponse.json({ error: "Giveaway is not active" }, { status: 400 });
    }
    if (!giveaway.isAgentEligible) {
      return NextResponse.json({ error: "This giveaway does not allow agent entries" }, { status: 403 });
    }
    if (new Date(giveaway.endAt) < new Date()) {
      return NextResponse.json({ error: "Giveaway has ended" }, { status: 400 });
    }

    // Check already entered
    const existing = await prisma.giveawayEntry.findUnique({
      where: {
        giveawayId_userId: { giveawayId: id, userId: agent.userId },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Already entered", entryId: existing.id }, { status: 409 });
    }

    // Get user's primary wallet (matching giveaway's chain if possible)
    const primaryWallet = await prisma.wallet.findFirst({
      where: { userId: agent.userId, isPrimary: true },
    });

    const entry = await prisma.giveawayEntry.create({
      data: {
        giveawayId: id,
        userId: agent.userId,
        walletId: primaryWallet?.id,
        walletAddress: primaryWallet?.address,
        xUsername: giveaway.requiresXFollow ? (agent.user as any).xHandle : null,
        enteredByAgent: true,
      },
    });

    await logAgentActivity(agent.id, "ENTER_GIVEAWAY", {
      giveawayId: id,
      entryId: entry.id,
    });

    return NextResponse.json({ success: true, entryId: entry.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
