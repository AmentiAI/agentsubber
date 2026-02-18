import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // discord.js and its deps are Node.js-only — never bundle them for the browser
  serverExternalPackages: [
    "discord.js",
    "@discordjs/ws",
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
