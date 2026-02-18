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
    const campaign = await prisma.allowlistCampaign.findUnique({
      where: { id: id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status !== "ACTIVE") {
      return NextResponse.json({ error: "Campaign is not active" }, { status: 400 });
    }
    if (campaign.filledSpots >= campaign.totalSpots) {
      return NextResponse.json({ error: "No spots remaining" }, { status: 400 });
    }
    if (campaign.closesAt && new Date(campaign.closesAt) < new Date()) {
      return NextResponse.json({ error: "Campaign has closed" }, { status: 400 });
    }

    // Get user's primary wallet matching campaign's chain
    const wallet = await prisma.wallet.findFirst({
      where: { userId: agent.userId, chain: campaign.chain, isPrimary: true },
    }) ?? await prisma.wallet.findFirst({
      where: { userId: agent.userId, chain: campaign.chain },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: `No ${campaign.chain} wallet found. Please link one in your dashboard.` },
        { status: 400 }
      );
    }

    // Check already entered
    const existing = await prisma.allowlistEntry.findUnique({
      where: {
        campaignId_walletAddress: { campaignId: id, walletAddress: wallet.address },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Wallet already registered", entryId: existing.id },
        { status: 409 }
      );
    }

    const [entry] = await prisma.$transaction([
      prisma.allowlistEntry.create({
        data: {
          campaignId: id,
          userId: agent.userId,
          walletId: wallet.id,
          walletAddress: wallet.address,
          entryMethod: "AGENT",
        },
      }),
      prisma.allowlistCampaign.update({
        where: { id: id },
        data: { filledSpots: { increment: 1 } },
      }),
    ]);

    await logAgentActivity(agent.id, "ENTER_ALLOWLIST", {
      campaignId: id,
      entryId: entry.id,
      walletAddress: wallet.address,
    });

    return NextResponse.json({ success: true, entryId: entry.id, walletAddress: wallet.address });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
