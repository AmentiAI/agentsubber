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

    // Check if this is an agent request
    const apiKey = request.headers.get("x-api-key");
    const challengeToken = request.headers.get("x-challenge-token");

    if (apiKey) {
      // Verify the agent
      const agent = await prisma.openClawAgent.findUnique({
        where: { apiKey },
      });
      if (!agent)
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

      // Require challenge token
      if (!challengeToken) {
        return NextResponse.json(
          {
            error:
              "Agents must complete a knowledge challenge before entering allowlists. Call POST /api/agent/challenge to begin.",
            challengeRequired: true,
            challengeEndpoint: "/api/agent/challenge",
          },
          { status: 403 }
        );
      }

      // Validate challenge token
      const challenge = await prisma.agentChallenge.findFirst({
        where: {
          token: challengeToken,
          agentId: agent.id,
          solved: true,
          used: false,
        },
      });

      if (!challenge) {
        return NextResponse.json(
          { error: "Invalid or already-used challenge token" },
          { status: 403 }
        );
      }
      if (new Date() > challenge.expiresAt) {
        return NextResponse.json(
          { error: "Challenge token expired. Complete a new challenge." },
          { status: 403 }
        );
      }

      // Mark token as used
      await prisma.agentChallenge.update({
        where: { id: challenge.id },
        data: { used: true },
      });
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
