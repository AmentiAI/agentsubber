"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Copy,
  Trash2,
  CheckCircle,
  Loader2,
  Star,
  ShieldCheck,
  Zap,
  AlertCircle,
  X,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// @ts-ignore
import bs58 from "bs58";

declare global {
  interface Window {
    unisat?: {
      requestAccounts(): Promise<string[]>;
      getAccounts(): Promise<string[]>;
      signMessage(msg: string, type?: string): Promise<string>;
    };
    XverseProviders?: {
      BitcoinProvider?: {
        request(method: string, params?: any): Promise<any>;
      };
    };
    LeatherProvider?: {
      request(method: string, params?: any): Promise<any>;
    };
    magicEden?: {
      bitcoin?: {
        connect(): Promise<{ ordinalAddress: string; paymentAddress: string }>;
        signMessage(address: string, message: string): Promise<{ signature: string }>;
      };
    };
  }
}

interface WalletRecord {
  id: string;
  address: string;
  chain: string;
  label: string | null;
  verified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

// ─── detect available BTC wallets ───
function detectBtcWallets() {
  const found: string[] = [];
  if (typeof window === "undefined") return found;
  if (window.unisat) found.push("unisat");
  if (window.XverseProviders?.BitcoinProvider) found.push("xverse");
  if (window.LeatherProvider) found.push("leather");
  if (window.magicEden?.bitcoin) found.push("magiceden");
  return found;
}

// ─── BTC wallet connector ───
async function connectBtcWallet(provider: string): Promise<{ address: string }> {
  if (provider === "unisat") {
    const accounts = await window.unisat!.requestAccounts();
    if (!accounts[0]) throw new Error("No account returned");
    return { address: accounts[0] };
  }
  if (provider === "xverse") {
    const resp = await window.XverseProviders!.BitcoinProvider!.request("getAccounts", {
      purposes: ["payment", "ordinals"],
    });
    const addresses: any[] = resp?.result?.addresses ?? [];
    const addr =
      addresses.find((a: any) => a.purpose === "payment")?.address ??
      addresses[0]?.address;
    if (!addr) throw new Error("No address returned");
    return { address: addr };
  }
  if (provider === "leather") {
    const resp = await window.LeatherProvider!.request("getAddresses");
    const addresses: any[] = resp?.result?.addresses ?? [];
    const addr = addresses.find((a: any) => a.type === "p2wpkh")?.address ?? addresses[0]?.address;
    if (!addr) throw new Error("No address returned");
    return { address: addr };
  }
  if (provider === "magiceden") {
    const resp = await window.magicEden!.bitcoin!.connect();
    return { address: resp.paymentAddress };
  }
  throw new Error("Unknown provider");
}

async function signBtcMessage(provider: string, address: string, message: string): Promise<string> {
  if (provider === "unisat") {
    return window.unisat!.signMessage(message, "ecdsa");
  }
  if (provider === "xverse") {
    const resp = await window.XverseProviders!.BitcoinProvider!.request("signMessage", { address, message });
    return resp?.result?.signature ?? resp?.result;
  }
  if (provider === "leather") {
    const resp = await window.LeatherProvider!.request("signMessage", {
      message,
      paymentType: "p2wpkh",
    });
    return resp?.result?.signature ?? resp?.result;
  }
  if (provider === "magiceden") {
    const resp = await window.magicEden!.bitcoin!.signMessage(address, message);
    return resp.signature;
  }
  throw new Error("Unknown provider");
}

const BTC_WALLETS: { id: string; name: string; icon: string }[] = [
  { id: "unisat", name: "Unisat", icon: "🟠" },
  { id: "xverse", name: "Xverse", icon: "🔵" },
  { id: "leather", name: "Leather", icon: "🟤" },
  { id: "magiceden", name: "Magic Eden", icon: "🟣" },
];

const chainColors: Record<string, string> = {
  SOL: "text-purple-400",
  BTC: "text-orange-400",
};
const chainBadgeVariants: Record<string, any> = {
  SOL: "sol",
  BTC: "btc",
};

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Connect modal state
  const [modal, setModal] = useState<null | "sol" | "btc">(null);
  const [modalLabel, setModalLabel] = useState("");
  const [modalStatus, setModalStatus] = useState<{ type: "idle" | "connecting" | "signing" | "saving" | "success" | "error"; text?: string }>({ type: "idle" });
  const [detectedBtcWallets, setDetectedBtcWallets] = useState<string[]>([]);
  const [btcProvider, setBtcProvider] = useState<string | null>(null);
  const [pendingBtcAddress, setPendingBtcAddress] = useState("");

  const solWallet = useWallet();

  useEffect(() => {
    fetch("/api/wallets")
      .then((r) => r.json())
      .then((data) => setWallets(data.wallets ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Detect BTC wallets when modal opens
  useEffect(() => {
    if (modal === "btc") {
      setDetectedBtcWallets(detectBtcWallets());
    }
  }, [modal]);

  function openModal(chain: "sol" | "btc") {
    setModal(chain);
    setModalLabel("");
    setModalStatus({ type: "idle" });
    setBtcProvider(null);
    setPendingBtcAddress("");
  }
  function closeModal() {
    setModal(null);
    setModalStatus({ type: "idle" });
  }

  // ─── shared connect helper ───
  const doConnect = useCallback(async (address: string, chain: string, message: string, signature: string) => {
    setModalStatus({ type: "saving" });
    const res = await fetch("/api/wallets/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, chain, label: modalLabel, message, signature }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
    // Upsert in local state
    setWallets((prev) => {
      const exists = prev.find((w) => w.id === data.wallet.id);
      if (exists) return prev.map((w) => (w.id === data.wallet.id ? data.wallet : w));
      return [...prev, data.wallet];
    });
    setModalStatus({ type: "success", text: "Wallet connected & verified!" });
    setTimeout(closeModal, 1500);
  }, [modalLabel]);

  // ─── SOL: connect + sign + save in one flow ───
  const doSolConnect = useCallback(async () => {
    if (!solWallet.connected || !solWallet.publicKey) {
      setModalStatus({ type: "error", text: "Connect your Solana wallet first using the button above." });
      return;
    }
    if (!solWallet.signMessage) {
      setModalStatus({ type: "error", text: "Your wallet does not support message signing." });
      return;
    }
    const address = solWallet.publicKey.toBase58();
    setModalStatus({ type: "signing", text: "Please approve the signing request in your wallet…" });
    try {
      const nonceRes = await fetch("/api/wallets/connect");
      const { nonce } = await nonceRes.json();
      const message = `Sign to verify ownership of ${address} on Communiclaw.\nNonce: ${nonce}`;

      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = await solWallet.signMessage(msgBytes);
      const signature = bs58.encode(sigBytes);

      await doConnect(address, "SOL", message, signature);
    } catch (err: any) {
      setModalStatus({ type: "error", text: err?.message ?? "Signing cancelled or failed" });
    }
  }, [solWallet, modalLabel, doConnect]);

  // ─── BTC: select provider → connect → sign → save ───
  const doBtcConnect = useCallback(async (provider: string) => {
    setBtcProvider(provider);
    setModalStatus({ type: "connecting", text: "Connecting to wallet…" });
    try {
      const { address } = await connectBtcWallet(provider);
      setPendingBtcAddress(address);

      setModalStatus({ type: "signing", text: "Please approve the signing request in your wallet…" });

      const nonceRes = await fetch("/api/wallets/connect");
      const { nonce } = await nonceRes.json();
      const message = `Sign to verify ownership of ${address} on Communiclaw.\nNonce: ${nonce}`;

      const signature = await signBtcMessage(provider, address, message);

      await doConnect(address, "BTC", message, signature);
    } catch (err: any) {
      setModalStatus({ type: "error", text: err?.message ?? "Connection failed" });
      setBtcProvider(null);
    }
  }, [modalLabel, doConnect]);

  async function removeWallet(walletId: string) {
    if (!confirm("Remove this wallet?")) return;
    const res = await fetch("/api/wallets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    if (res.ok) setWallets((prev) => prev.filter((w) => w.id !== walletId));
  }

  async function setPrimary(walletId: string) {
    const res = await fetch("/api/wallets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    if (res.ok) setWallets((prev) => prev.map((w) => ({ ...w, isPrimary: w.id === walletId })));
  }

  function copyAddress(wallet: WalletRecord) {
    navigator.clipboard.writeText(wallet.address);
    setCopiedId(wallet.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const isBusy = ["connecting", "signing", "saving", "success"].includes(modalStatus.type);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)]">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-24 lg:pb-10">
          <div className="max-w-2xl">

            <div className="flex items-center gap-3 mb-8">
              <Wallet className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl sm:text-4xl font-black text-white">My Wallets</h1>
            </div>

            {/* Add wallet buttons */}
            <div className="grid grid-cols-2 gap-5 mb-10">
              <button
                onClick={() => openModal("sol")}
                className="group p-7 rounded-2xl border-2 border-dashed border-[rgb(60,60,80)] hover:border-purple-500 bg-[rgb(14,14,22)] hover:bg-purple-600/10 transition-all text-left"
              >
                <div className="text-3xl mb-3">◎</div>
                <div className="text-lg font-bold text-white mb-1">Connect Solana</div>
                <div className="text-sm text-[rgb(130,130,150)]">Phantom, Solflare, Backpack</div>
              </button>
              <button
                onClick={() => openModal("btc")}
                className="group p-7 rounded-2xl border-2 border-dashed border-[rgb(60,60,80)] hover:border-orange-500 bg-[rgb(14,14,22)] hover:bg-orange-600/10 transition-all text-left"
              >
                <div className="text-3xl mb-3">₿</div>
                <div className="text-lg font-bold text-white mb-1">Connect Bitcoin</div>
                <div className="text-sm text-[rgb(130,130,150)]">Unisat, Xverse, Leather</div>
              </button>
            </div>

            {/* Wallet list */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-[rgb(30,30,40)] flex items-center justify-center mx-auto mb-5">
                  <Wallet className="w-10 h-10 text-[rgb(130,130,150)]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No wallets connected</h3>
                <p className="text-base text-[rgb(130,130,150)]">
                  Connect a Solana or Bitcoin wallet to enter giveaways and allowlists.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <Card key={wallet.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-xl bg-[rgb(22,22,30)] flex items-center justify-center shrink-0 text-2xl`}>
                            {wallet.chain === "SOL" ? "◎" : "₿"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <code className="text-base text-white font-mono">
                                {truncateAddress(wallet.address, 8)}
                              </code>
                              <Badge variant={chainBadgeVariants[wallet.chain]} className="text-xs py-0">
                                {wallet.chain}
                              </Badge>
                              {wallet.isPrimary && (
                                <Badge variant="default" className="text-xs py-0 gap-1">
                                  <Star className="w-2.5 h-2.5" />Primary
                                </Badge>
                              )}
                              {wallet.verified ? (
                                <Badge variant="success" className="text-xs py-0 gap-1">
                                  <CheckCircle className="w-2.5 h-2.5" />Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs py-0">Unverified</Badge>
                              )}
                            </div>
                            {wallet.label && (
                              <div className="text-sm text-[rgb(130,130,150)]">{wallet.label}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!wallet.isPrimary && (
                            <Button variant="ghost" size="sm" onClick={() => setPrimary(wallet.id)} className="text-xs gap-1">
                              <Star className="w-3 h-3" />Set Primary
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => copyAddress(wallet)}>
                            {copiedId === wallet.id ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeWallet(wallet.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── CONNECT MODAL ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-[rgb(14,14,22)] border-0 sm:border border-[rgb(40,40,55)] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgb(30,30,45)]">
              <h2 className="text-xl font-black text-white">
                {modal === "sol" ? "◎ Connect Solana" : "₿ Connect Bitcoin"}
              </h2>
              <button onClick={closeModal} disabled={isBusy} className="p-2 rounded-lg text-[rgb(100,100,120)] hover:text-white transition-colors disabled:opacity-40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Label input — always visible */}
              <div>
                <label className="block text-sm font-medium text-[rgb(180,180,200)] mb-2">Label (optional)</label>
                <Input
                  placeholder="e.g. Main wallet, Trading, Ordinals..."
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                  disabled={isBusy}
                  className="text-base"
                />
              </div>

              {/* ── SOL FLOW ── */}
              {modal === "sol" && (
                <div className="space-y-4">
                  {/* Wallet adapter connect button */}
                  <div className="flex flex-col items-start gap-2">
                    <label className="text-sm font-medium text-[rgb(180,180,200)]">Step 1 — Connect</label>
                    <WalletMultiButton style={{
                      background: solWallet.connected ? "rgb(22, 80, 50)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      borderRadius: "12px", fontSize: "15px", height: "48px", width: "100%", justifyContent: "center",
                    }} />
                    {solWallet.connected && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {truncateAddress(solWallet.publicKey?.toBase58() ?? "", 8)}
                      </div>
                    )}
                  </div>
                  {solWallet.connected && (
                    <div>
                      <label className="text-sm font-medium text-[rgb(180,180,200)] mb-2 block">Step 2 — Sign to verify ownership</label>
                      <Button
                        variant="gradient"
                        className="w-full h-12 text-base gap-2"
                        onClick={doSolConnect}
                        disabled={isBusy}
                      >
                        {modalStatus.type === "signing" ? <Loader2 className="w-5 h-5 animate-spin" /> :
                         modalStatus.type === "saving" ? <Loader2 className="w-5 h-5 animate-spin" /> :
                         modalStatus.type === "success" ? <CheckCircle className="w-5 h-5" /> :
                         <ShieldCheck className="w-5 h-5" />}
                        {modalStatus.type === "signing" ? "Waiting for signature…" :
                         modalStatus.type === "saving" ? "Saving…" :
                         modalStatus.type === "success" ? "Connected!" :
                         "Sign & Add Wallet"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── BTC FLOW ── */}
              {modal === "btc" && !btcProvider && (
                <div>
                  <label className="text-sm font-medium text-[rgb(180,180,200)] mb-3 block">Choose your Bitcoin wallet</label>
                  <div className="space-y-2">
                    {BTC_WALLETS.map((w) => {
                      const available = detectedBtcWallets.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          onClick={() => available && doBtcConnect(w.id)}
                          disabled={!available || isBusy}
                          className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left ${
                            available
                              ? "border-[rgb(50,50,70)] hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer"
                              : "border-[rgb(35,35,50)] opacity-40 cursor-not-allowed"
                          }`}
                        >
                          <span className="text-2xl">{w.icon}</span>
                          <div className="flex-1">
                            <div className="text-base font-semibold text-white">{w.name}</div>
                            <div className="text-xs text-[rgb(120,120,140)]">
                              {available ? "Detected — click to connect" : "Not installed"}
                            </div>
                          </div>
                          {available && <Zap className="w-4 h-4 text-orange-400" />}
                        </button>
                      );
                    })}
                  </div>
                  {detectedBtcWallets.length === 0 && (
                    <div className="mt-4 flex items-start gap-2 p-4 rounded-xl bg-orange-900/20 border border-orange-500/30">
                      <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-orange-300">
                        No Bitcoin wallet extension detected. Install <strong>Unisat</strong>, <strong>Xverse</strong>, or <strong>Leather</strong> and refresh.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* BTC connecting/signing state */}
              {modal === "btc" && btcProvider && (
                <div className="flex flex-col items-center py-6 gap-4">
                  {modalStatus.type !== "error" && (
                    <Loader2 className={`w-10 h-10 ${modalStatus.type === "success" ? "hidden" : "animate-spin text-orange-400"}`} />
                  )}
                  {modalStatus.type === "success" && <CheckCircle className="w-10 h-10 text-green-400" />}
                  {modalStatus.type === "error" && <AlertCircle className="w-10 h-10 text-red-400" />}
                  <div className="text-center">
                    <div className="text-base font-semibold text-white mb-1">
                      {modalStatus.type === "connecting" && "Connecting…"}
                      {modalStatus.type === "signing" && "Sign the message in your wallet"}
                      {modalStatus.type === "saving" && "Saving wallet…"}
                      {modalStatus.type === "success" && "Connected!"}
                      {modalStatus.type === "error" && "Something went wrong"}
                    </div>
                    {modalStatus.text && (
                      <div className={`text-sm ${modalStatus.type === "error" ? "text-red-400" : "text-[rgb(140,140,160)]"}`}>
                        {modalStatus.text}
                      </div>
                    )}
                    {pendingBtcAddress && modalStatus.type === "signing" && (
                      <code className="text-xs text-orange-400 mt-1 block">{truncateAddress(pendingBtcAddress, 10)}</code>
                    )}
                  </div>
                  {modalStatus.type === "error" && (
                    <Button variant="outline" onClick={() => { setBtcProvider(null); setModalStatus({ type: "idle" }); setPendingBtcAddress(""); }}>
                      Try again
                    </Button>
                  )}
                </div>
              )}

              {/* Status for SOL */}
              {modal === "sol" && modalStatus.type === "error" && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{modalStatus.text}</p>
                </div>
              )}
              {modal === "sol" && modalStatus.type === "success" && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-green-900/20 border border-green-500/30">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-300">{modalStatus.text}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
