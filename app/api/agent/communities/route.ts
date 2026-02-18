import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent, logAgentActivity } from "@/lib/openclaw";

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: "Invalid or missing agent key" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const search = searchParams.get("search");

    const where: any = { isActive: true };
    if (chain) where.chain = chain;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const communities = await prisma.community.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        chain: true,
        memberCount: true,
        verified: true,
        memberAccess: { select: { gateType: true } },
        _count: {
          select: {
            giveaways: { where: { status: "ACTIVE" } },
            allowlistCampaigns: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { memberCount: "desc" },
      take: 50,
    });

    await logAgentActivity(agent.id, "BROWSE_COMMUNITIES", { count: communities.length });

    return NextResponse.json({ communities });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
