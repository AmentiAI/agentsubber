"use client";
// @omnisat/lasereyes was unavailable at install time — using passthrough provider.
// BTC wallet connect uses manual address entry flow on the wallets page.
export function BTCWalletProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
