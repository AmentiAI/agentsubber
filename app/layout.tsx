import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import dynamic from "next/dynamic";
import "./globals.css";
import Providers from "./providers";
import PusherBeamsInit from "@/components/PusherBeamsInit";

const GlobalChat = dynamic(() => import("@/components/chat/GlobalChat"), { ssr: false });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Communiclaw – Web3 Community Management",
    template: "%s | Communiclaw",
  },
  description:
    "The ultimate Web3 community platform. Manage allowlists, run giveaways, launch presales, and power your community with AI agents.",
  keywords: ["NFT", "allowlist", "giveaway", "Solana", "Bitcoin", "Ordinals", "Web3", "community"],
  openGraph: {
    title: "Communiclaw – Web3 Community Management",
    description:
      "Manage allowlists, run giveaways, launch presales, and power your community with AI agents.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ background: "rgb(10,10,15)" }}
      >
        <Providers>
          {children}
          <GlobalChat />
        </Providers>
        <PusherBeamsInit />
        <Script
          src="https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
