/**
 * Live crypto price fetcher.
 * Tries multiple free APIs in order — never falls back to a hardcoded guess.
 */

export interface CryptoPrices {
  btc: number;
  sol: number;
}

async function fromCoinGecko(): Promise<CryptoPrices> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd",
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const d = await res.json();
  if (!d?.bitcoin?.usd || !d?.solana?.usd) throw new Error("CoinGecko bad response");
  return { btc: d.bitcoin.usd, sol: d.solana.usd };
}

async function fromBinance(): Promise<CryptoPrices> {
  const [btcRes, solRes] = await Promise.all([
    fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", { signal: AbortSignal.timeout(5000) }),
    fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", { signal: AbortSignal.timeout(5000) }),
  ]);
  if (!btcRes.ok || !solRes.ok) throw new Error("Binance error");
  const [btcD, solD] = await Promise.all([btcRes.json(), solRes.json()]);
  const btc = parseFloat(btcD.price);
  const sol = parseFloat(solD.price);
  if (!btc || !sol) throw new Error("Binance bad response");
  return { btc, sol };
}

async function fromCoinbase(): Promise<CryptoPrices> {
  const [btcRes, solRes] = await Promise.all([
    fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { signal: AbortSignal.timeout(5000) }),
    fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", { signal: AbortSignal.timeout(5000) }),
  ]);
  if (!btcRes.ok || !solRes.ok) throw new Error("Coinbase error");
  const [btcD, solD] = await Promise.all([btcRes.json(), solRes.json()]);
  const btc = parseFloat(btcD?.data?.amount);
  const sol = parseFloat(solD?.data?.amount);
  if (!btc || !sol) throw new Error("Coinbase bad response");
  return { btc, sol };
}

/**
 * Fetch live BTC + SOL prices in USD.
 * Tries CoinGecko → Binance → Coinbase in order.
 * Throws if ALL sources fail — never returns a made-up number.
 */
export async function getLiveCryptoPrices(): Promise<CryptoPrices> {
  const sources = [fromCoinGecko, fromBinance, fromCoinbase];
  const errors: string[] = [];

  for (const fn of sources) {
    try {
      const prices = await fn();
      // Sanity check — reject obviously wrong prices
      if (prices.btc < 1000 || prices.btc > 10_000_000) throw new Error(`BTC price ${prices.btc} out of range`);
      if (prices.sol < 0.01 || prices.sol > 100_000) throw new Error(`SOL price ${prices.sol} out of range`);
      return prices;
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  throw new Error(`All price sources failed: ${errors.join(" | ")}`);
}
