import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// @ts-ignore
import nacl from "tweetnacl";
// @ts-ignore
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { walletId, address, message, signature, chain } = await req.json();

  try {
    if (chain === "SOL") {
      const pubkey = new PublicKey(address);
      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = bs58.decode(signature);
      const pubkeyBytes = pubkey.toBytes();
      const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
      if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    // Mark wallet as verified in DB
    await prisma.wallet.update({
      where: { id: walletId, userId: session.user.id },
      data: { verified: true },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }
}
