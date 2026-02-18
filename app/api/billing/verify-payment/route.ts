import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BTC_TREASURY = "bc1qcvr75grjxtty40pzvj5p0fxsy0zgg9p2zatyr2";
const SOL_TREASURY = "FFspB8K5Zpt99tNu1PTgNiRVW2TyjDo2rbcbkfDx7Nz5";

async function checkBTCPayment(address: string, expectedAmount: number): Promise<string | null> {
  try {
    const res = await fetch(`https://mempool.space/api/address/${address}/txs`);
    const txs = await res.json();
    // Check recent txs for incoming amount
    for (const tx of txs.slice(0, 10)) {
      const received = tx.vout?.reduce((sum: number, out: any) => {
        if (out.scriptpubkey_address === address) return sum + out.value;
        return sum;
      }, 0) ?? 0;
      const receivedBTC = received / 1e8;
      if (receivedBTC >= expectedAmount * 0.99) return tx.txid;
    }
  } catch {}
  return null;
}

async function checkSOLPayment(address: string, _expectedLamports: number): Promise<string | null> {
  try {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "getSignaturesForAddress",
        params: [address, { limit: 10 }],
      }),
    });
    const data = await res.json();
    if (data.result?.length > 0) return data.result[0].signature;
  } catch {}
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId } = await req.json();
  const payment = await (prisma as any).paymentRecord.findFirst({
    where: { id: paymentId, userId: session.user.id, status: "PENDING" },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const BTC_PRICE_USD = 97000;
  const SOL_PRICE_USD = 180;

  let txHash: string | null = null;
  if (payment.chain === "BTC") {
    const expectedBTC = payment.amountUSD / BTC_PRICE_USD;
    txHash = await checkBTCPayment(BTC_TREASURY, expectedBTC);
  } else if (payment.chain === "SOL") {
    const expectedSOL = payment.amountUSD / SOL_PRICE_USD;
    const expectedLamports = expectedSOL * 1e9;
    txHash = await checkSOLPayment(SOL_TREASURY, expectedLamports);
  }

  if (!txHash) {
    return NextResponse.json({ confirmed: false, message: "Payment not detected yet. Please wait a few minutes." });
  }

  // Confirm payment and upgrade subscription
  const planEnd = new Date();
  planEnd.setMonth(planEnd.getMonth() + 1);

  await (prisma as any).$transaction([
    (prisma as any).paymentRecord.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", txHash, confirmedAt: new Date() },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: { plan: payment.plan as any, status: "active", currentPeriodEnd: planEnd },
      create: { userId: session.user.id, plan: payment.plan as any, status: "active", currentPeriodEnd: planEnd },
    }),
  ]);

  return NextResponse.json({ confirmed: true, txHash });
}
