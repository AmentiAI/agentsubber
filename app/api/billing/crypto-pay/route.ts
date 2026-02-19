import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = { PRO: 9.99, ELITE: 24.99 };
const BTC_TREASURY = "bc1qcvr75grjxtty40pzvj5p0fxsy0zgg9p2zatyr2";
const SOL_TREASURY = "FFspB8K5Zpt99tNu1PTgNiRVW2TyjDo2rbcbkfDx7Nz5";

// Fetch live prices from CoinGecko (free, no key needed)
async function getLivePrices(): Promise<{ btc: number; sol: number }> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd",
      { next: { revalidate: 60 } } // cache 60s
    );
    const data = await res.json();
    return { btc: data.bitcoin.usd, sol: data.solana.usd };
  } catch {
    // Fallback to reasonable estimates if CoinGecko is down
    return { btc: 95000, sol: 145 };
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, chain } = await req.json();
  if (!PLAN_PRICES[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const usd = PLAN_PRICES[plan];
  const memo = `comm-${session.user.id.slice(-6)}-${Date.now()}`;
  const { btc: btcPrice, sol: solPrice } = await getLivePrices();

  let amount: string;
  let address: string;
  let expectedAmountRaw: string;
  let lamports: number | undefined;
  let amountSats: number | undefined;
  let priceUsed: string;

  if (chain === "BTC") {
    const baseSatoshi = Math.round((usd / btcPrice) * 1e8);
    const uniqueSatoshi = baseSatoshi + Math.floor(Math.random() * 999) + 1;
    if (uniqueSatoshi < 600) {
      return NextResponse.json({ error: "BTC amount below dust threshold. Contact support." }, { status: 400 });
    }
    amount = (uniqueSatoshi / 1e8).toFixed(8);
    address = BTC_TREASURY;
    expectedAmountRaw = uniqueSatoshi.toString();
    amountSats = uniqueSatoshi;
    priceUsed = `BTC @ $${btcPrice.toLocaleString()}`;
  } else if (chain === "SOL") {
    const solAmount = usd / solPrice;
    amount = solAmount.toFixed(4);
    address = SOL_TREASURY;
    lamports = Math.round(solAmount * 1e9);
    expectedAmountRaw = lamports.toString();
    priceUsed = `SOL @ $${solPrice.toFixed(2)}`;
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

  return NextResponse.json({ payment, amount, address, memo, lamports, amountSats, priceUsed });
}
