"use client";

import dynamic from "next/dynamic";

const GlobalChat = dynamic(() => import("./GlobalChat"), { ssr: false });

export default function GlobalChatLoader() {
  return <GlobalChat />;
}
