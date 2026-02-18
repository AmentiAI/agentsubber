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
  if (chain === "BTC") {
    amount = (usd / BTC_PRICE_USD).toFixed(8);
    address = BTC_TREASURY;
  } else if (chain === "SOL") {
    amount = (usd / SOL_PRICE_USD).toFixed(4);
    address = SOL_TREASURY;
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
    },
  });

  return NextResponse.json({ payment, amount, address, memo });
}
