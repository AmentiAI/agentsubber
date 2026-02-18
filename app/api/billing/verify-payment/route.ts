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
    if (!res.ok)
      return {
        valid: false,
        confirmed: false,
        error: "Transaction not found on Bitcoin network",
      };
    const tx = await res.json();

    // Check it sends to our treasury.
    // IMPORTANT: Ignore any output < 600 sats — these are dust/inscription UTXOs
    // (Ordinals and BRC-20 inscriptions use 546-599 sat outputs). We never want
    // to accidentally accept an inscription as payment.
    const DUST_THRESHOLD = 600; // satoshis
    const sentToTreasury =
      tx.vout?.reduce((sum: number, out: any) => {
        const value = out.value ?? 0;
        if (out.scriptpubkey_address === BTC_TREASURY && value >= DUST_THRESHOLD)
          return sum + value;
        return sum;
      }, 0) ?? 0;

    if (sentToTreasury === 0) {
      return {
        valid: false,
        confirmed: false,
        error: "Transaction does not send to Communiclaw treasury (or only contains dust/inscription outputs below 600 sats)",
      };
    }

    // Check amount is within 1% of expected (accounts for rounding)
    if (sentToTreasury < expectedSat * 0.99) {
      return {
        valid: false,
        confirmed: false,
        error: `Insufficient amount: sent ${sentToTreasury} sat, expected ~${expectedSat} sat`,
      };
    }

    // Check confirmation (status.confirmed = true means at least 1 block confirmation)
    const confirmed = tx.status?.confirmed === true;

    return { valid: true, confirmed };
  } catch (e: any) {
    return { valid: false, confirmed: false, error: e.message };
  }
}

async function verifySOLTransaction(
  signature: string,
  expectedLamports: number
): Promise<{ valid: boolean; confirmed: boolean; error?: string }> {
  try {
    const rpc =
      process.env.NEXT_PUBLIC_SOLANA_RPC ??
      "https://api.mainnet-beta.solana.com";

    // Get the transaction
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          signature,
          {
            encoding: "json",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          },
        ],
      }),
    });
    const data = await res.json();

    if (!data.result) {
      return {
        valid: false,
        confirmed: false,
        error: "Transaction not found on Solana network",
      };
    }

    const tx = data.result;

    // Check transaction is not failed
    if (
      tx.meta?.err !== null &&
      tx.meta?.err !== undefined &&
      tx.meta.err !== null
    ) {
      return {
        valid: false,
        confirmed: false,
        error: "Transaction failed on-chain",
      };
    }

    // Find treasury account index
    const accountKeys: string[] =
      tx.transaction?.message?.accountKeys ?? [];
    const treasuryIdx = accountKeys.findIndex(
      (k: string) => k === SOL_TREASURY
    );
    if (treasuryIdx === -1) {
      return {
        valid: false,
        confirmed: false,
        error: "Transaction does not involve Communiclaw treasury wallet",
      };
    }

    // Check lamport change for treasury (post - pre = amount received)
    const preBalances: number[] = tx.meta?.preBalances ?? [];
    const postBalances: number[] = tx.meta?.postBalances ?? [];
    const received =
      (postBalances[treasuryIdx] ?? 0) - (preBalances[treasuryIdx] ?? 0);

    if (received < expectedLamports * 0.99) {
      return {
        valid: false,
        confirmed: false,
        error: `Insufficient amount: received ${received} lamports, expected ~${expectedLamports} lamports`,
      };
    }

    // Solana transactions in getTransaction with "confirmed" commitment are confirmed
    return { valid: true, confirmed: true };
  } catch (e: any) {
    return { valid: false, confirmed: false, error: e.message };
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId, txHash } = await req.json();

  if (!txHash?.trim()) {
    return NextResponse.json(
      { error: "Please provide your transaction hash/ID" },
      { status: 400 }
    );
  }

  const payment = await (prisma as any).paymentRecord.findFirst({
    where: { id: paymentId, userId: session.user.id, status: "PENDING" },
  });
  if (!payment)
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Check if this txHash was already used for another payment
  const txAlreadyUsed = await (prisma as any).paymentRecord.findFirst({
    where: { txHashSubmitted: txHash, status: "CONFIRMED" },
  });
  if (txAlreadyUsed) {
    return NextResponse.json(
      { error: "This transaction has already been used for a payment" },
      { status: 400 }
    );
  }

  // Parse expected amount
  const expectedRaw = payment.expectedAmountRaw
    ? Number(payment.expectedAmountRaw)
    : 0;

  let result: { valid: boolean; confirmed: boolean; error?: string };

  if (payment.chain === "BTC") {
    result = await verifyBTCTransaction(
      txHash,
      expectedRaw || Math.round((payment.amountUSD / 97000) * 1e8)
    );
  } else if (payment.chain === "SOL") {
    result = await verifySOLTransaction(
      txHash,
      expectedRaw || Math.round((payment.amountUSD / 180) * 1e9)
    );
  } else {
    return NextResponse.json({ error: "Unknown chain" }, { status: 400 });
  }

  if (!result.valid) {
    return NextResponse.json({
      confirmed: false,
      error: result.error ?? "Could not verify transaction",
    });
  }

  if (!result.confirmed) {
    // Save txHash so we can re-check later without user re-entering it
    await (prisma as any).paymentRecord.update({
      where: { id: payment.id },
      data: { txHashSubmitted: txHash },
    });
    return NextResponse.json({
      confirmed: false,
      pending: true,
      message:
        "Transaction found but waiting for confirmation. Check back in 1-2 minutes.",
    });
  }

  // Fully confirmed — upgrade subscription
  const planEnd = new Date();
  planEnd.setMonth(planEnd.getMonth() + 1);

  await (prisma as any).$transaction([
    (prisma as any).paymentRecord.update({
      where: { id: payment.id },
      data: {
        status: "CONFIRMED",
        txHash,
        txHashSubmitted: txHash,
        confirmedAt: new Date(),
      },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: payment.plan as any,
        status: "active",
        currentPeriodEnd: planEnd,
      },
      create: {
        userId: session.user.id,
        plan: payment.plan as any,
        status: "active",
        currentPeriodEnd: planEnd,
      },
    }),
  ]);

  return NextResponse.json({ confirmed: true, txHash });
}
