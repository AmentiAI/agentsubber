import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that must NOT be bundled — they use Node.js native modules or
  // rely on runtime require() patterns that webpack can't handle.
  serverExternalPackages: [
    // Prisma + pg driver
    "@prisma/client",
    "@prisma/adapter-pg",
    "prisma",
    "pg",
    "pg-native",
    "pg-pool",
    // Discord.js and its deps
    "discord.js",
    "@discordjs/ws",
    "@discordjs/rest",
    "@discordjs/rest",
    "@discordjs/builders",
    "@discordjs/collection",
    "discord-api-types",
    "zlib-sync",
    "bufferutil",
    "erlpack",
  ],
};

export default nextConfig;
