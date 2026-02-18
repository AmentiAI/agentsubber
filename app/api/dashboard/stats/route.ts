import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [communities, activeGiveaways, allowlistEntries, agent, wallets, wins] =
      await Promise.all([
        prisma.community.count({ where: { ownerUserId: userId } }),
        prisma.giveaway.count({
          where: {
            community: { ownerUserId: userId },
            status: "ACTIVE",
          },
        }),
        prisma.allowlistEntry.count({ where: { userId } }),
        prisma.openClawAgent.findUnique({ where: { userId } }),
        prisma.wallet.count({ where: { userId } }),
        prisma.giveawayWinner.count({ where: { userId } }),
      ]);

    return NextResponse.json({
      communities,
      activeGiveaways,
      allowlistEntries,
      agentRegistered: !!agent,
      wallets,
      wins,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
