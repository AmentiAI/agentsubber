import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWebhook } from "@/lib/discord";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { webhookUrl, communityName } = await req.json();
  if (!webhookUrl) return NextResponse.json({ error: "webhookUrl required" }, { status: 400 });

  const ok = await sendWebhook(webhookUrl, "", [
    {
      title: "✅ Discord Integration Connected!",
      description: `**${communityName ?? "Your community"}** is now connected to Communiclaw.\n\nGiveaways, allowlists, and presale announcements will automatically post here.`,
      color: 0x8b5cf6,
      footer: { text: "Communiclaw · Web3 Community Platform" },
      timestamp: new Date().toISOString(),
    },
  ]);

  if (!ok) return NextResponse.json({ error: "Webhook delivery failed — check the URL." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
