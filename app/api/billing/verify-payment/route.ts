import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BTC_TREASURY = "bc1qcvr75grjxtty40pzvj5p0fxsy0zgg9p2zatyr2";
const SOL_TREASURY = "FFspB8K5Zpt99tNu1PTgNiRVW2TyjDo2rbcbkfDx7Nz5";

async function verifyBTCTransaction(
  txid: string,
  expectedSat: number
): Promise<{ valid: boolean; confirmed: boolean; error?: string }> {
  try {
    const res = await fetch(`https://mempool.space/api/tx/${txid}`);
    if (!res.ok) return { valid: false, confirmed: false, error: "Transaction not found on Bitcoin network" };
    const tx = await res.json();
    const DUST_THRESHOLD = 600;
    const sentToTreasury =
      tx.vout?.reduce((sum: number, out: any) => {
        const value = out.value ?? 0;
        if (out.scriptpubkey_address === BTC_TREASURY && value >= DUST_THRESHOLD) return sum + value;
        return sum;
      }, 0) ?? 0;
    if (sentToTreasury === 0) return { valid: false, confirmed: false, error: "Transaction does not send to Communiclaw BTC treasury" };
    if (sentToTreasury < expectedSat * 0.99) return { valid: false, confirmed: false, error: `Insufficient: sent ${sentToTreasury} sat, expected ~${expectedSat} sat` };
    return { valid: true, confirmed: tx.status?.confirmed === true };
  } catch (e: any) {
    return { valid: false, confirmed: false, error: e.message };
  }
}

async function verifySOLTransaction(
  signature: string,
  expectedLamports: number
): Promise<{ valid: boolean; confirmed: boolean; error?: string }> {
  try {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "getTransaction",
        params: [signature, { encoding: "json", commitment: "confirmed", maxSupportedTransactionVersion: 0 }],
      }),
    });
    const data = await res.json();
    if (!data.result) return { valid: false, confirmed: false, error: "Transaction not found on Solana network" };
    const tx = data.result;
    if (tx.meta?.err !== null && tx.meta?.err !== undefined) return { valid: false, confirmed: false, error: "Transaction failed on-chain" };
    const accountKeys: string[] = tx.transaction?.message?.accountKeys ?? [];
    const treasuryIdx = accountKeys.findIndex((k: string) => k === SOL_TREASURY);
    if (treasuryIdx === -1) return { valid: false, confirmed: false, error: "Transaction does not involve Communiclaw SOL treasury" };
    const preBalances: number[] = tx.meta?.preBalances ?? [];
    const postBalances: number[] = tx.meta?.postBalances ?? [];
    const received = (postBalances[treasuryIdx] ?? 0) - (preBalances[treasuryIdx] ?? 0);
    if (received < expectedLamports * 0.99) return { valid: false, confirmed: false, error: `Insufficient: received ${received} lamports, expected ~${expectedLamports}` };
    return { valid: true, confirmed: true };
  } catch (e: any) {
    return { valid: false, confirmed: false, error: e.message };
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId, txHash } = await req.json();
  if (!txHash?.trim()) return NextResponse.json({ error: "Transaction hash required" }, { status: 400 });

  const payment = await prisma.paymentRecord.findFirst({
    where: { id: paymentId, userId: session.user.id },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Already confirmed
  if (payment.status === "CONFIRMED") return NextResponse.json({ confirmed: true, txHash: payment.txHash });

  // Replay protection
  const txAlreadyUsed = await prisma.paymentRecord.findFirst({ where: { txHash, status: "CONFIRMED" } });
  if (txAlreadyUsed) return NextResponse.json({ error: "This transaction has already been used" }, { status: 400 });

  // expectedAmountRaw is always set at payment creation from live prices — never guess
  if (!payment.expectedAmountRaw) {
    return NextResponse.json({ error: "Payment record missing expected amount — contact support." }, { status: 500 });
  }
  const expectedRaw = Number(payment.expectedAmountRaw);
  let result: { valid: boolean; confirmed: boolean; error?: string };

  if (payment.chain === "BTC") {
    result = await verifyBTCTransaction(txHash, expectedRaw);
  } else if (payment.chain === "SOL") {
    result = await verifySOLTransaction(txHash, expectedRaw);
  } else {
    return NextResponse.json({ error: "Unknown chain" }, { status: 400 });
  }

  if (!result.valid) {
    return NextResponse.json({ confirmed: false, error: result.error ?? "Could not verify transaction" });
  }

  if (!result.confirmed) {
    // Save txHash so we can check again without user re-entering
    await prisma.paymentRecord.update({ where: { id: payment.id }, data: { txHashSubmitted: txHash } });
    return NextResponse.json({ confirmed: false, pending: true, message: "Transaction found — waiting for on-chain confirmation." });
  }

  // ── Confirmed: upgrade subscription ──────────────────────────────────────
  const planEnd = new Date();
  planEnd.setMonth(planEnd.getMonth() + 1);

  await prisma.$transaction([
    prisma.paymentRecord.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", txHash, txHashSubmitted: txHash, confirmedAt: new Date() },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: { plan: payment.plan as any, status: "active", currentPeriodEnd: planEnd },
      create: { userId: session.user.id, plan: payment.plan as any, status: "active", currentPeriodEnd: planEnd },
    }),
  ]);

  // Notify user
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: `${payment.plan} Plan Activated! 🎉`,
      type: "SYSTEM",
      message: `Your ${payment.plan} plan is now active. Enjoy the upgrade!`,
    },
  });

  return NextResponse.json({ confirmed: true, txHash });
}
