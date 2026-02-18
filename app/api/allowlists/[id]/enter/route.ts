import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

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

    // Check if wallet already registered
    const existing = await prisma.allowlistEntry.findUnique({
      where: {
        campaignId_walletAddress: {
          campaignId: id,
          walletAddress,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Wallet already registered" }, { status: 409 });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { address: walletAddress, userId: session.user.id },
    });

    const [entry] = await prisma.$transaction([
      prisma.allowlistEntry.create({
        data: {
          campaignId: id,
          userId: session.user.id,
          walletId: wallet?.id,
          walletAddress,
          entryMethod: "FCFS",
        },
      }),
      prisma.allowlistCampaign.update({
        where: { id: id },
        data: { filledSpots: { increment: 1 } },
      }),
    ]);

    // Close if full
    if (campaign.filledSpots + 1 >= campaign.totalSpots) {
      await prisma.allowlistCampaign.update({
        where: { id: id },
        data: { status: "CLOSED" },
      });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
