import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { address } = await req.json();
  const message = `Sign this message to verify ownership of ${address} on Communiclaw.\n\nNonce: ${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return NextResponse.json({ message });
}
