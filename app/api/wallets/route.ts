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

    const wallets = await prisma.wallet.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ wallets });
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

    const body = await request.json();
    const { address, chain, label } = body;

    if (!address || !chain) {
      return NextResponse.json({ error: "Address and chain required" }, { status: 400 });
    }

    if (!["SOL", "BTC", "ETH"].includes(chain)) {
      return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
    }

    // Check if already linked to any account
    const existing = await prisma.wallet.findFirst({
      where: { address, chain },
    });
    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "This wallet is already linked to another account" }, { status: 409 });
    }
    if (existing && existing.userId === session.user.id) {
      return NextResponse.json({ error: "Wallet already connected" }, { status: 409 });
    }

    // Check if user has any wallets (first one becomes primary)
    const walletCount = await prisma.wallet.count({ where: { userId: session.user.id } });

    const wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        address,
        chain,
        label: label || null,
        verified: false,
        isPrimary: walletCount === 0,
      },
    });

    return NextResponse.json({ wallet }, { status: 201 });
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
    const { walletId } = body;

    await prisma.wallet.deleteMany({
      where: { id: walletId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
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
    const { walletId } = body;

    // Set as primary (unset all others first)
    await prisma.$transaction([
      prisma.wallet.updateMany({
        where: { userId: session.user.id },
        data: { isPrimary: false },
      }),
      prisma.wallet.update({
        where: { id: walletId, userId: session.user.id },
        data: { isPrimary: true },
      } as any),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
