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
      return NextResponse.json({ error: "Sign in required to purchase" }, { status: 401 });
    }

    const body = await request.json();
    const { walletAddress, quantity = 1 } = body as {
      walletAddress: string;
      quantity?: number;
    };

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    const presale = await prisma.presale.findUnique({
      where: { id },
    });

    if (!presale) {
      return NextResponse.json({ error: "Presale not found" }, { status: 404 });
    }
    if (presale.status !== "ACTIVE") {
      return NextResponse.json({ error: "Presale is not active" }, { status: 400 });
    }
    if (presale.soldCount + quantity > presale.totalSupply) {
      return NextResponse.json({ error: "Not enough supply remaining" }, { status: 400 });
    }
    if (new Date(presale.endsAt) < new Date()) {
      return NextResponse.json({ error: "Presale has ended" }, { status: 400 });
    }

    // Check per-wallet limit
    if (presale.maxPerWallet) {
      const existing = await prisma.presaleOrder.count({
        where: { presaleId: id, walletAddress },
      });
      if (existing + quantity > presale.maxPerWallet) {
        return NextResponse.json(
          { error: `Maximum ${presale.maxPerWallet} per wallet` },
          { status: 400 }
        );
      }
    }

    const [order] = await prisma.$transaction([
      prisma.presaleOrder.create({
        data: {
          presaleId: id,
          userId: session.user.id,
          walletAddress,
          quantity,
          status: "PENDING",
        },
      }),
      prisma.presale.update({
        where: { id },
        data: { soldCount: { increment: quantity } },
      }),
    ]);

    return NextResponse.json({ success: true, orderId: order.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
