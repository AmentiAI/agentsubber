/**
 * Discord Interactions endpoint.
 * Used if you register slash commands with your bot.
 * Discord sends POST requests here after you set the Interactions Endpoint URL
 * in your Discord Developer Portal → Application → General Information.
 *
 * For now this handles a ping (type=1) to verify the endpoint,
 * and defers all slash commands for future expansion.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";

export async function POST(request: NextRequest) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Discord public key not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-signature-ed25519") ?? "";
  const timestamp = request.headers.get("x-signature-timestamp") ?? "";
  const rawBody = await request.text();

  const isValid = verifyKey(Buffer.from(rawBody), signature, timestamp, publicKey);
  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Type 1 = PING (Discord verifies the endpoint)
  if (body.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Type 2 = APPLICATION_COMMAND (slash commands)
  if (body.type === 2) {
    const { name } = body.data;

    // /ping
    if (name === "ping") {
      return NextResponse.json({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: { content: "Pong! Communiclaw bot is alive. 🤖" },
      });
    }

    // Unknown command
    return NextResponse.json({
      type: 4,
      data: { content: "Unknown command.", flags: 64 },
    });
  }

  return NextResponse.json({ error: "Unknown interaction type" }, { status: 400 });
}
