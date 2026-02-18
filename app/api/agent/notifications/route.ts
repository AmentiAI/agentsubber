import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent, logAgentActivity } from "@/lib/openclaw";

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: "Invalid or missing agent key" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: agent.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    await logAgentActivity(agent.id, "READ_NOTIFICATIONS");

    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
