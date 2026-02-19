import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [users, communities, giveaways, allowlists, presales, payments, chatMessages, posts] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.giveaway.count(),
    prisma.allowlistCampaign.count(),
    prisma.presale.count(),
    prisma.paymentRecord.count(),
    (prisma as any).chatMessage.count(),
    (prisma as any).post?.count?.() ?? 0,
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, xHandle: true, image: true, createdAt: true, subscription: { select: { plan: true } } },
  });

  const planBreakdown = await prisma.subscription.groupBy({
    by: ["plan"],
    _count: { plan: true },
  });

  return NextResponse.json({ users, communities, giveaways, allowlists, presales, payments, chatMessages, posts, recentUsers, planBreakdown });
}
