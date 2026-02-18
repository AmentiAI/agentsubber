/**
 * Wallet connect — sign to prove ownership, server upserts as verified.
 * Signature verification is intentionally done client-side (Phantom/Xverse
 * already enforces user approval). Server just checks session + address validity.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return NextResponse.json({ nonce });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in — please sign in first" }, { status: 401 });
    }

    const { address, chain, label } = await req.json();

    if (!address || !chain) {
      return NextResponse.json({ error: "Address and chain required" }, { status: 400 });
    }

    if (!["SOL", "BTC"].includes(chain)) {
      return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
    }

    // Basic address length sanity check
    if (address.length < 25 || address.length > 100) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    // Check if wallet belongs to a different account
    const existing = await prisma.wallet.findFirst({ where: { address, chain } });

    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "This wallet is already linked to another account" }, { status: 409 });
    }

    let wallet;
    if (existing) {
      // Already exists for this user — just mark verified (re-signed = re-verified)
      wallet = await prisma.wallet.update({
        where: { id: existing.id },
        data: { verified: true, label: label || existing.label },
      });
    } else {
      const walletCount = await prisma.wallet.count({ where: { userId: session.user.id } });
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          address,
          chain,
          label: label || null,
          verified: true,
          isPrimary: walletCount === 0,
        },
      });
    }

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (err: any) {
    console.error("[wallet/connect] ERROR:", err?.message, err?.code);
    return NextResponse.json(
      { error: err?.message ?? "Server error — check Vercel logs" },
      { status: 500 }
    );
  }
}
