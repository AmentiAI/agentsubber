import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent, logAgentActivity } from "@/lib/openclaw";

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: "Invalid or missing agent key" }, { status: 401 });
  }

  try {
    const campaigns = await prisma.allowlistCampaign.findMany({
      where: {
        status: "ACTIVE",
        filledSpots: { lt: prisma.allowlistCampaign.fields.totalSpots },
      },
      include: {
        community: { select: { id: true, name: true, slug: true, chain: true } },
      },
      orderBy: { closesAt: "asc" },
      take: 50,
    });

    // Get open campaigns (filledSpots < totalSpots) - filter manually
    const openCampaigns = campaigns.filter((c) => c.filledSpots < c.totalSpots);

    // Check which ones the user already entered
    const userWallets = agent.user.wallets.map((w: any) => w.address);
    const enteredIds = new Set(
      (
        await prisma.allowlistEntry.findMany({
          where: {
            campaignId: { in: openCampaigns.map((c) => c.id) },
            walletAddress: { in: userWallets.length > 0 ? userWallets : ["none"] },
          },
          select: { campaignId: true },
        })
      ).map((e) => e.campaignId)
    );

    const result = openCampaigns.map((c) => ({
      ...c,
      spotsRemaining: c.totalSpots - c.filledSpots,
      alreadyEntered: enteredIds.has(c.id),
    }));

    await logAgentActivity(agent.id, "BROWSE_ALLOWLISTS", { count: result.length });

    return NextResponse.json({ campaigns: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
