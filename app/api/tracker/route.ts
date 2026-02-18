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

    const alerts = await prisma.walletTrackerAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ alerts });
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

    // Check Elite plan
    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    if (!sub || sub.plan !== "ELITE") {
      return NextResponse.json({ error: "Elite plan required" }, { status: 403 });
    }

    const body = await request.json();
    const { watchedAddress, chain, webhookUrl, telegramChatId } = body;

    if (!watchedAddress || !chain) {
      return NextResponse.json({ error: "Address and chain required" }, { status: 400 });
    }

    const alert = await prisma.walletTrackerAlert.create({
      data: {
        userId: session.user.id,
        watchedAddress,
        chain,
        webhookUrl: webhookUrl || null,
        telegramChatId: telegramChatId || null,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alertId } = body;

    await prisma.walletTrackerAlert.deleteMany({
      where: { id: alertId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
