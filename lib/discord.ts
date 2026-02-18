import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from "discord.js";

let _client: Client | null = null;
let _ready = false;

/**
 * Returns a ready Discord.js Client.
 * Reuses the singleton across hot-reloads in development.
 */
async function getDiscordClient(): Promise<Client> {
  const g = globalThis as any;

  if (g._discordClient && g._discordReady) {
    return g._discordClient;
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN is not set");
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  await new Promise<void>((resolve, reject) => {
    client.once("ready", () => resolve());
    client.once("error", reject);
    client.login(process.env.DISCORD_BOT_TOKEN).catch(reject);
  });

  g._discordClient = client;
  g._discordReady = true;
  return client;
}

/**
 * Post a giveaway announcement to a Discord channel.
 */
export async function postGiveawayAnnouncement({
  channelId,
  giveawayTitle,
  prize,
  winners,
  endAt,
  entryUrl,
  communityName,
}: {
  channelId: string;
  giveawayTitle: string;
  prize: string;
  winners: number;
  endAt: Date;
  entryUrl: string;
  communityName: string;
}) {
  try {
    const client = await getDiscordClient();
    const channel = await client.channels.fetch(channelId) as TextChannel | null;
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`🎉 New Giveaway: ${giveawayTitle}`)
      .setDescription(`**${communityName}** is hosting a giveaway!`)
      .addFields(
        { name: "Prize", value: prize, inline: true },
        { name: "Winners", value: `${winners}`, inline: true },
        { name: "Ends", value: `<t:${Math.floor(endAt.getTime() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: "Communiclaw · Web3 Community Platform" })
      .setTimestamp();

    await channel.send({
      content: `🎁 **Giveaway Alert!** Enter now → ${entryUrl}`,
      embeds: [embed],
    });
  } catch (err) {
    console.error("[Discord] postGiveawayAnnouncement failed:", err);
  }
}

/**
 * Post winner announcement to a Discord channel.
 */
export async function postWinnerAnnouncement({
  channelId,
  giveawayTitle,
  winners,
  communityName,
}: {
  channelId: string;
  giveawayTitle: string;
  winners: Array<{ xHandle?: string | null; name?: string | null; walletAddress?: string | null }>;
  communityName: string;
}) {
  try {
    const client = await getDiscordClient();
    const channel = await client.channels.fetch(channelId) as TextChannel | null;
    if (!channel?.isTextBased()) return;

    const winnerList = winners
      .map((w, i) => {
        const id = w.xHandle ? `@${w.xHandle}` : w.name ?? "Anonymous";
        return `${i + 1}. **${id}**`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle(`🏆 Giveaway Winners: ${giveawayTitle}`)
      .setDescription(winnerList)
      .setFooter({ text: `${communityName} · Communiclaw` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("[Discord] postWinnerAnnouncement failed:", err);
  }
}

/**
 * Assign a Discord role to a user (for winner roles).
 */
export async function assignWinnerRole({
  guildId,
  discordUserId,
  roleId,
}: {
  guildId: string;
  discordUserId: string;
  roleId: string;
}) {
  try {
    const client = await getDiscordClient();
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordUserId);
    await member.roles.add(roleId);
  } catch (err) {
    console.error("[Discord] assignWinnerRole failed:", err);
  }
}
