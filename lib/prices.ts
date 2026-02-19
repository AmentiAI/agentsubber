/**
 * Live BTC + SOL price fetcher.
 * Sources tested from our server:
 *   1. Kraken  — exchange API, no key, no geo-block, highly accurate
 *   2. Coinbase — spot price API, no key, reliable
 *   3. CoinGecko — aggregator, no key needed for basic calls
 *
 * Never returns a hardcoded guess. Throws if all sources fail.
 */

export interface CryptoPrices {
  btc: number;
  sol: number;
}

async function fromKraken(): Promise<CryptoPrices> {
  const res = await fetch(
    "https://api.kraken.com/0/public/Ticker?pair=XBTUSD,SOLUSD",
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) throw new Error(`Kraken HTTP ${res.status}`);
  const d = await res.json();
  if (d.error?.length) throw new Error(`Kraken: ${d.error[0]}`);
  const result = d.result;
  // Kraken uses XXBTZUSD for BTC
  const btcData = result["XXBTZUSD"] ?? result["XBTUSD"];
  const solData = result["SOLUSD"];
  if (!btcData || !solData) throw new Error("Kraken: missing pair data");
  const btc = parseFloat(btcData.c[0]); // c = last trade closed [price, lot volume]
  const sol = parseFloat(solData.c[0]);
  if (!btc || !sol) throw new Error("Kraken: bad price values");
  return { btc, sol };
}

async function fromCoinbase(): Promise<CryptoPrices> {
  const [btcRes, solRes] = await Promise.all([
    fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { signal: AbortSignal.timeout(6000) }),
    fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", { signal: AbortSignal.timeout(6000) }),
  ]);
  if (!btcRes.ok || !solRes.ok) throw new Error(`Coinbase HTTP ${btcRes.status}/${solRes.status}`);
  const [btcD, solD] = await Promise.all([btcRes.json(), solRes.json()]);
  const btc = parseFloat(btcD?.data?.amount);
  const sol = parseFloat(solD?.data?.amount);
  if (!btc || !sol) throw new Error("Coinbase: bad price values");
  return { btc, sol };
}

async function fromCoinGecko(): Promise<CryptoPrices> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd",
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const d = await res.json();
  const btc = d?.bitcoin?.usd;
  const sol = d?.solana?.usd;
  if (!btc || !sol) throw new Error("CoinGecko: bad price values");
  return { btc, sol };
}

function validate(prices: CryptoPrices, source: string): CryptoPrices {
  // Sanity bounds — reject obviously wrong values
  if (prices.btc < 5000 || prices.btc > 10_000_000)
    throw new Error(`${source}: BTC price $${prices.btc} is out of range`);
  if (prices.sol < 0.50 || prices.sol > 100_000)
    throw new Error(`${source}: SOL price $${prices.sol} is out of range`);
  return prices;
}

export async function getLiveCryptoPrices(): Promise<CryptoPrices> {
  const sources: Array<[string, () => Promise<CryptoPrices>]> = [
    ["Kraken", fromKraken],
    ["Coinbase", fromCoinbase],
    ["CoinGecko", fromCoinGecko],
  ];

  const errors: string[] = [];
  for (const [name, fn] of sources) {
    try {
      const prices = await fn();
      return validate(prices, name);
    } catch (e: any) {
      errors.push(`${name}: ${e.message}`);
    }
  }

  throw new Error(`All price APIs failed — ${errors.join(" | ")}`);
}
