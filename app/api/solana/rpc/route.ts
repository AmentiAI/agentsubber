/**
 * Server-side Solana RPC proxy.
 * Browser → our API → Solana RPC (server IPs aren't blocked by rate limits)
 * Only allows safe read methods needed for payment (getLatestBlockhash, getTransaction, sendTransaction).
 */
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = new Set([
  "getLatestBlockhash",
  "getTransaction",
  "sendTransaction",
  "getSignatureStatuses",
]);

// SOLANA_RPC_URL is set in Vercel env (Helius key). Fallbacks used if missing.
const PRIMARY = process.env.SOLANA_RPC_URL;
const RPCS = [
  ...(PRIMARY ? [PRIMARY] : []),
  "https://solana.publicnode.com",
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!ALLOWED_METHODS.has(body?.method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 403 });
  }

  let lastError = "";
  for (const rpc of RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastError = `${rpc}: HTTP ${res.status}`;
        continue;
      }
      const data = await res.json();
      if (data?.error) {
        lastError = `${rpc}: ${data.error.message ?? JSON.stringify(data.error)}`;
        continue;
      }
      return NextResponse.json(data);
    } catch (e: any) {
      lastError = `${rpc}: ${e.message}`;
    }
  }

  return NextResponse.json(
    { jsonrpc: "2.0", error: { code: -32000, message: `All RPCs failed. Last: ${lastError}` }, id: body.id },
    { status: 503 }
  );
}
