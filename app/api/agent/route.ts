import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateApiKey } from "@/lib/openclaw";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.openClawAgent.findUnique({
      where: { userId: session.user.id },
      include: {
        activity: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ agent: null });
    }

    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only 1 agent per user
    const existing = await prisma.openClawAgent.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "Agent already registered" }, { status: 409 });
    }

    const body = await request.json();
    const { agentName } = body;

    if (!agentName?.trim()) {
      return NextResponse.json({ error: "Agent name required" }, { status: 400 });
    }

    const agent = await prisma.openClawAgent.create({
      data: {
        userId: session.user.id,
        agentName: agentName.trim(),
        apiKey: generateApiKey(),
      },
      include: { activity: true },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive, agentName } = body;

    const agent = await prisma.openClawAgent.update({
      where: { userId: session.user.id },
      data: {
        ...(typeof isActive === "boolean" && { isActive }),
        ...(agentName && { agentName }),
      },
      include: { activity: { orderBy: { createdAt: "desc" }, take: 10 } },
    });

    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE = regenerate key
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newKey = generateApiKey();
    const agent = await prisma.openClawAgent.update({
      where: { userId: session.user.id },
      data: { apiKey: newKey },
    });

    return NextResponse.json({ apiKey: agent.apiKey });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
