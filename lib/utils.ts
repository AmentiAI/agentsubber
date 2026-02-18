import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatSOL(lamports: number): string {
  return `${(lamports / 1e9).toFixed(2)} SOL`;
}

export function timeUntil(date: Date): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getChainIcon(chain: string): string {
  const icons: Record<string, string> = {
    SOL: "◎",
    BTC: "₿",
    ETH: "Ξ",
  };
  return icons[chain] ?? "?";
}

export function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    SOL: "text-purple-400",
    BTC: "text-orange-400",
    ETH: "text-blue-400",
  };
  return colors[chain] ?? "text-gray-400";
}
