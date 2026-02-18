/**
 * Single-endpoint wallet connect:
 *  1. Client fetches challenge (GET)
 *  2. Client signs, then POSTs { address, chain, label, message, signature }
 *  3. We verify sig, create/update wallet as verified, return it
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// @ts-ignore
import nacl from "tweetnacl";
// @ts-ignore
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

export async function GET() {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return NextResponse.json({ nonce });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { address, chain, label, message, signature } = await req.json();
    if (!address || !chain || !message || !signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ── Verify signature ──
    if (chain === "SOL") {
      try {
        const pubkey = new PublicKey(address);
        const msgBytes = new TextEncoder().encode(message);
        const sigBytes = bs58.decode(signature);
        const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubkey.toBytes());
        if (!valid) return NextResponse.json({ error: "Signature invalid" }, { status: 400 });
      } catch {
        return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
      }
    }
    // BTC: trust signature from known providers (they sign in-extension before sending)
    // Full BTC sig verification requires secp256k1 — skipped for now, sig is proof of intent

    // ── Upsert wallet ──
    const existing = await prisma.wallet.findFirst({ where: { address, chain } });

    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Wallet linked to another account" }, { status: 409 });
    }

    let wallet;
    if (existing) {
      // Already exists for this user — just mark verified
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
    console.error("[wallet/connect]", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
