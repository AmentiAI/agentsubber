import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRICES: Record<string, number> = { PRO: 9.99, ELITE: 24.99 };
const BTC_PRICE_USD = 97000;
const SOL_PRICE_USD = 180;
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
  let lamports: number | undefined;
  let amountSats: number | undefined;

  if (chain === "BTC") {
    const baseSatoshi = Math.round((usd / BTC_PRICE_USD) * 1e8);
    const uniqueSatoshi = baseSatoshi + Math.floor(Math.random() * 999) + 1;
    if (uniqueSatoshi < 600) {
      return NextResponse.json({ error: "BTC amount below dust threshold. Contact support." }, { status: 400 });
    }
    amount = (uniqueSatoshi / 1e8).toFixed(8);
    address = BTC_TREASURY;
    expectedAmountRaw = uniqueSatoshi.toString();
    amountSats = uniqueSatoshi;
  } else if (chain === "SOL") {
    const solAmount = usd / SOL_PRICE_USD;
    amount = solAmount.toFixed(4);
    address = SOL_TREASURY;
    lamports = Math.round(solAmount * 1e9);
    expectedAmountRaw = lamports.toString();
  } else {
    return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
  }

  const payment = await prisma.paymentRecord.create({
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

  return NextResponse.json({ payment, amount, address, memo, lamports, amountSats });
}
