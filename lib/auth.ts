import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  debug: process.env.NODE_ENV !== "production",
  events: {
    async createUser({ user }) {
      console.log("[NextAuth] Created user:", user.id);
    },
    async linkAccount({ user, account }) {
      console.log("[NextAuth] Linked account:", account.provider, "to user:", user.id);
    },
    async signIn({ user, account }) {
      console.log("[NextAuth] Sign in:", user.id, account?.provider);
    },
  },
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            xHandle: true,
            xProfilePic: true,
            username: true,
            subscription: { select: { plan: true } },
          },
        });
        if (dbUser) {
          (session.user as any).role = dbUser.role;
          (session.user as any).xHandle = dbUser.xHandle;
          (session.user as any).plan = dbUser.subscription?.plan ?? "FREE";
          (session.user as any).username = dbUser.username;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter" && profile) {
        const twitterProfile = profile as any;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            xHandle: twitterProfile.data?.username ?? twitterProfile.screen_name,
            xProfilePic: twitterProfile.data?.profile_image_url ?? (profile as any).profile_image_url_https,
            xId: twitterProfile.data?.id ?? twitterProfile.id_str,
            name: twitterProfile.data?.name ?? twitterProfile.name,
          },
        }).catch(() => {});
        // Ensure subscription row exists
        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: { userId: user.id, plan: "FREE" },
          update: {},
        }).catch(() => {});
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
