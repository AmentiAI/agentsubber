import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const communities = await prisma.community.findMany({
      where: { ownerUserId: session.user.id, isActive: true },
      include: {
        _count: {
          select: { giveaways: true, allowlistCampaigns: true, presales: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ communities });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
