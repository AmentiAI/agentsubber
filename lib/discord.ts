/**
 * Discord webhook helper — no bot token, no long-running process.
 * Community owners paste a webhook URL; we POST embeds to it.
 */

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  thumbnail?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export async function sendWebhook(
  webhookUrl: string,
  content: string,
  embeds: DiscordEmbed[] = []
): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds }),
    });
    return res.ok;
  } catch (err) {
    console.error("[Discord webhook] failed:", err);
    return false;
  }
}

/* ── Announcement helpers ── */

export async function postGiveawayAnnouncement({
  webhookUrl,
  giveawayTitle,
  prize,
  winners,
  endAt,
  entryUrl,
  communityName,
  logoUrl,
}: {
  webhookUrl: string;
  giveawayTitle: string;
  prize: string;
  winners: number;
  endAt: Date;
  entryUrl: string;
  communityName: string;
  logoUrl?: string | null;
}) {
  const embed: DiscordEmbed = {
    title: `🎉 New Giveaway: ${giveawayTitle}`,
    description: `**${communityName}** is giving away **${prize}**!\n\n👉 [Enter now](${entryUrl})`,
    color: 0x8b5cf6,
    fields: [
      { name: "Prize", value: prize, inline: true },
      { name: "Winners", value: `${winners}`, inline: true },
      { name: "Ends", value: `<t:${Math.floor(endAt.getTime() / 1000)}:R>`, inline: true },
    ],
    footer: { text: "Communiclaw · Web3 Community Platform" },
    timestamp: new Date().toISOString(),
  };
  if (logoUrl?.startsWith("http")) embed.thumbnail = { url: logoUrl };
  return sendWebhook(webhookUrl, `🎁 **Giveaway Alert!** Enter now → ${entryUrl}`, [embed]);
}

export async function postAllowlistAnnouncement({
  webhookUrl,
  campaignName,
  totalSpots,
  entryMethod,
  entryUrl,
  communityName,
  closesAt,
  logoUrl,
}: {
  webhookUrl: string;
  campaignName: string;
  totalSpots: number;
  entryMethod: string;
  entryUrl: string;
  communityName: string;
  closesAt?: Date | null;
  logoUrl?: string | null;
}) {
  const embed: DiscordEmbed = {
    title: `📋 Allowlist Open: ${campaignName}`,
    description: `**${communityName}** allowlist is now open!\n\n👉 [Secure your spot](${entryUrl})`,
    color: 0x6366f1,
    fields: [
      { name: "Total Spots", value: `${totalSpots}`, inline: true },
      { name: "Method", value: entryMethod, inline: true },
      ...(closesAt ? [{ name: "Closes", value: `<t:${Math.floor(closesAt.getTime() / 1000)}:R>`, inline: true }] : []),
    ],
    footer: { text: "Communiclaw · Web3 Community Platform" },
    timestamp: new Date().toISOString(),
  };
  if (logoUrl?.startsWith("http")) embed.thumbnail = { url: logoUrl };
  return sendWebhook(webhookUrl, `📋 **Allowlist Alert!** Grab your spot → ${entryUrl}`, [embed]);
}

export async function postPresaleAnnouncement({
  webhookUrl,
  presaleName,
  priceSOL,
  priceBTC,
  totalSupply,
  entryUrl,
  communityName,
  logoUrl,
}: {
  webhookUrl: string;
  presaleName: string;
  priceSOL?: number | null;
  priceBTC?: number | null;
  totalSupply: number;
  entryUrl: string;
  communityName: string;
  logoUrl?: string | null;
}) {
  const price = priceSOL ? `${priceSOL} SOL` : priceBTC ? `${priceBTC} BTC` : "TBA";
  const embed: DiscordEmbed = {
    title: `🛒 Presale Live: ${presaleName}`,
    description: `**${communityName}** presale is now active!\n\n👉 [Buy now](${entryUrl})`,
    color: 0x10b981,
    fields: [
      { name: "Price", value: price, inline: true },
      { name: "Total Supply", value: `${totalSupply}`, inline: true },
    ],
    footer: { text: "Communiclaw · Web3 Community Platform" },
    timestamp: new Date().toISOString(),
  };
  if (logoUrl?.startsWith("http")) embed.thumbnail = { url: logoUrl };
  return sendWebhook(webhookUrl, `🛒 **Presale Alert!** Buy now → ${entryUrl}`, [embed]);
}

export async function postWinnerAnnouncement({
  webhookUrl,
  giveawayTitle,
  winners,
  communityName,
}: {
  webhookUrl: string;
  giveawayTitle: string;
  winners: Array<{ xHandle?: string | null; name?: string | null }>;
  communityName: string;
}) {
  const winnerList = winners
    .map((w, i) => `${i + 1}. **${w.xHandle ? `@${w.xHandle}` : w.name ?? "Anonymous"}**`)
    .join("\n");

  const embed: DiscordEmbed = {
    title: `🏆 Winners Drawn: ${giveawayTitle}`,
    description: winnerList,
    color: 0xf59e0b,
    footer: { text: `${communityName} · Communiclaw` },
    timestamp: new Date().toISOString(),
  };
  return sendWebhook(webhookUrl, `🏆 **Winners announced for ${giveawayTitle}!**`, [embed]);
}
