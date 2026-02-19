import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BTC_TREASURY = "bc1qcvr75grjxtty40pzvj5p0fxsy0zgg9p2zatyr2";
const SOL_TREASURY = "FFspB8K5Zpt99tNu1PTgNiRVW2TyjDo2rbcbkfDx7Nz5";

// Allow up to 3% tolerance — covers rounding differences between price calculation and lamport conversion
const TOLERANCE = 0.97;

// ─── BTC via mempool.space ────────────────────────────────────────────────────
async function verifyBTCTransaction(
  txid: string,
  expectedSat: number
): Promise<{ valid: boolean; confirmed: boolean; error?: string }> {
  try {
    const res = await fetch(`https://mempool.space/api/tx/${txid}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { valid: false, confirmed: false, error: `Transaction not found on Bitcoin network (mempool.space ${res.status})` };
    }
    const tx = await res.json();

    // Find outputs to our treasury — skip dust/inscription outputs < 600 sats
    const sentToTreasury: number =
      tx.vout?.reduce((sum: number, out: any) => {
        const value = out.value ?? 0;
        if (out.scriptpubkey_address === BTC_TREASURY && value >= 600) return sum + value;
        return sum;
      }, 0) ?? 0;

    if (sentToTreasury === 0) {
      return { valid: false, confirmed: false, error: "No payment found to Communiclaw BTC treasury in this transaction" };
    }

    // Accept if within 3% of expected (covers price rounding + slight underpay)
    if (sentToTreasury < expectedSat * TOLERANCE) {
      return {
        valid: false,
        confirmed: false,
        error: `Amount too low: received ${sentToTreasury.toLocaleString()} sat, need at least ${Math.round(expectedSat * TOLERANCE).toLocaleString()} sat`,
      };
    }

    const confirmed = tx.status?.confirmed === true;
    return { valid: true, confirmed };
  } catch (e: any) {
    return { valid: false, confirmed: false, error: `BTC check failed: ${e.message}` };
  }
}

// ─── SOL via Helius RPC ───────────────────────────────────────────────────────
async function verifySOLTransaction(
  signature: string,
  expectedLamports: number
): Promise<{ valid: boolean; confirmed: boolean; error?: string }> {
  // Use our Helius key if set, otherwise fall back to public RPC
  const rpc =
    process.env.SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_SOLANA_RPC ??
    "https://api.mainnet-beta.solana.com";

  // Retry up to 3 times — tx may take a few seconds to be indexable
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: attempt,
          method: "getTransaction",
          params: [signature, { encoding: "json", commitment: "confirmed", maxSupportedTransactionVersion: 0 }],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        if (attempt < 3) { await new Promise(r => setTimeout(r, 2000)); continue; }
        return { valid: false, confirmed: false, error: `Solana RPC error ${res.status}` };
      }

      const data = await res.json();

      if (!data.result) {
        // Not indexed yet — if first attempts, retry
        if (attempt < 3) { await new Promise(r => setTimeout(r, 3000)); continue; }
        return { valid: false, confirmed: false, error: "Transaction not found on Solana yet — it may still be propagating. Try again in 10 seconds." };
      }

      const tx = data.result;

      // Check transaction didn't fail
      if (tx.meta?.err) {
        return { valid: false, confirmed: false, error: `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}` };
      }

      // Find treasury in account keys
      const accountKeys: string[] = tx.transaction?.message?.accountKeys ?? [];
      const treasuryIdx = accountKeys.findIndex((k: string) => k === SOL_TREASURY);
      if (treasuryIdx === -1) {
        return { valid: false, confirmed: false, error: "Transaction does not send to Communiclaw SOL treasury" };
      }

      // Check received lamports
      const preBalances: number[] = tx.meta?.preBalances ?? [];
      const postBalances: number[] = tx.meta?.postBalances ?? [];
      const received = (postBalances[treasuryIdx] ?? 0) - (preBalances[treasuryIdx] ?? 0);

      if (received <= 0) {
        return { valid: false, confirmed: false, error: "Treasury balance did not increase — treasury may not have received funds" };
      }

      if (received < expectedLamports * TOLERANCE) {
        const receivedSol = (received / 1e9).toFixed(6);
        const expectedSol = (expectedLamports / 1e9).toFixed(6);
        return {
          valid: false,
          confirmed: false,
          error: `Amount too low: received ${receivedSol} SOL, expected at least ${(expectedLamports * TOLERANCE / 1e9).toFixed(6)} SOL`,
        };
      }

      // SOL txs returned by getTransaction with commitment=confirmed ARE confirmed
      return { valid: true, confirmed: true };
    } catch (e: any) {
      if (attempt < 3) { await new Promise(r => setTimeout(r, 2000)); continue; }
      return { valid: false, confirmed: false, error: `SOL check failed: ${e.message}` };
    }
  }

  return { valid: false, confirmed: false, error: "Verification timed out — please try again" };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId, txHash } = await req.json();
  if (!txHash?.trim()) return NextResponse.json({ error: "Transaction hash required" }, { status: 400 });

  const payment = await prisma.paymentRecord.findFirst({
    where: { id: paymentId, userId: session.user.id },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Already confirmed — return immediately
  if (payment.status === "CONFIRMED") {
    return NextResponse.json({ confirmed: true, txHash: payment.txHash });
  }

  // Replay protection — same tx can't confirm two payments
  const txAlreadyUsed = await prisma.paymentRecord.findFirst({
    where: { txHash, status: "CONFIRMED", NOT: { id: payment.id } },
  });
  if (txAlreadyUsed) {
    return NextResponse.json({ error: "This transaction has already been used for another payment" }, { status: 400 });
  }

  if (!payment.expectedAmountRaw) {
    return NextResponse.json({ error: "Payment record corrupted — contact support" }, { status: 500 });
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

  // Save txHash regardless so we can re-check without re-entry
  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: { txHashSubmitted: txHash },
  });

  if (!result.valid) {
    return NextResponse.json({ confirmed: false, error: result.error });
  }

  if (!result.confirmed) {
    return NextResponse.json({
      confirmed: false,
      pending: true,
      message: "Transaction found — waiting for on-chain confirmation.",
    });
  }

  // ── Fully confirmed → upgrade plan ────────────────────────────────────────
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

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: `${payment.plan} Plan Activated! 🎉`,
      type: "SYSTEM",
      message: `Your ${payment.plan} plan is now active. Thank you!`,
    },
  });

  return NextResponse.json({ confirmed: true, txHash });
}
