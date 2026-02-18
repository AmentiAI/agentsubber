import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRICES: Record<string, number> = { PRO: 9.99, ELITE: 24.99 };
const BTC_PRICE_USD = 97000; // approximate, update as needed
const SOL_PRICE_USD = 180;   // approximate
const BTC_TREASURY = "bc1qcvr75grjxtty40pzvj5p0fxsy0zgg9p2zatyr2";
const SOL_TREASURY = "FFspB8K5Zpt99tNu1PTgNiRVW2TyjDo2rbcbkfDx7Nz5";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, chain } = await req.json();
  if (!PRICES[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const usd = PRICES[plan];
  const memo = `comm-${session.user.id.slice(-6)}-${Date.now()}`;

  let amount: string;
  let address: string;
  let expectedAmountRaw: string;

  if (chain === "BTC") {
    // Generate unique amounts for identification (random 1-999 sat added for uniqueness)
    const baseSatoshi = Math.round((usd / BTC_PRICE_USD) * 1e8);
    const uniqueSatoshi = baseSatoshi + Math.floor(Math.random() * 999) + 1;
    // Safety guard: NEVER generate a payment request below 600 sats (dust / inscription threshold).
    // In practice plan prices ensure we're always 10,000+ sats, but guard anyway.
    if (uniqueSatoshi < 600) {
      return NextResponse.json({ error: "Calculated BTC amount is below dust threshold. Contact support." }, { status: 400 });
    }
    const uniqueAmount = (uniqueSatoshi / 1e8).toFixed(8);
    amount = uniqueAmount;
    address = BTC_TREASURY;
    expectedAmountRaw = uniqueSatoshi.toString();
  } else if (chain === "SOL") {
    amount = (usd / SOL_PRICE_USD).toFixed(4);
    address = SOL_TREASURY;
    expectedAmountRaw = Math.round(parseFloat(amount) * 1e9).toString();
  } else {
    return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
  }

  // Save pending payment
  const payment = await (prisma as any).paymentRecord.create({
    data: {
      userId: session.user.id,
      plan,
      chain,
      amountUSD: usd,
      memo,
      status: "PENDING",
      expectedAmountRaw,
    },
  });

  return NextResponse.json({ payment, amount, address, memo });
}
