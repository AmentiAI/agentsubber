import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent, logAgentActivity } from "@/lib/openclaw";

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: "Invalid or missing agent key" }, { status: 401 });
  }

  try {
    const giveaways = await prisma.giveaway.findMany({
      where: { status: "ACTIVE", isAgentEligible: true },
      include: {
        community: {
          select: { id: true, name: true, slug: true, logoUrl: true, chain: true },
        },
        _count: { select: { entries: true } },
      },
      orderBy: { endAt: "asc" },
      take: 50,
    });

    // Check which ones the user already entered
    const enteredIds = new Set(
      (
        await prisma.giveawayEntry.findMany({
          where: {
            userId: agent.userId,
            giveawayId: { in: giveaways.map((g) => g.id) },
          },
          select: { giveawayId: true },
        })
      ).map((e) => e.giveawayId)
    );

    const result = giveaways.map((g) => ({
      ...g,
      alreadyEntered: enteredIds.has(g.id),
    }));

    await logAgentActivity(agent.id, "BROWSE_GIVEAWAYS", { count: result.length });

    return NextResponse.json({ giveaways: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
