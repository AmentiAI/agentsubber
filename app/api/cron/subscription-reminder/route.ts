/**
 * Daily cron — checks subscriptions expiring in 7 days or 1 day
 * and creates notifications. Called by Vercel cron (see vercel.json).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find subs expiring in exactly 7 days (±12h window)
  const in7days = new Date(now.getTime() + 7 * 86400000);
  const in7start = new Date(in7days.getTime() - 12 * 3600000);
  const in7end = new Date(in7days.getTime() + 12 * 3600000);

  // Find subs expiring in exactly 1 day (±12h window)
  const in1day = new Date(now.getTime() + 1 * 86400000);
  const in1start = new Date(in1day.getTime() - 12 * 3600000);
  const in1end = new Date(in1day.getTime() + 12 * 3600000);

  const [expiring7, expiring1] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        status: "active",
        plan: { not: "FREE" },
        currentPeriodEnd: { gte: in7start, lte: in7end },
      },
      select: { userId: true, plan: true, currentPeriodEnd: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: "active",
        plan: { not: "FREE" },
        currentPeriodEnd: { gte: in1start, lte: in1end },
      },
      select: { userId: true, plan: true, currentPeriodEnd: true },
    }),
  ]);

  const notifications: any[] = [
    ...expiring7.map((s) => ({
      userId: s.userId,
      title: `Your ${s.plan} plan expires in 7 days`,
      type: "SYSTEM",
      message: `Your ${s.plan} subscription expires on ${new Date(s.currentPeriodEnd!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Renew now to keep your communities and features active.`,
    })),
    ...expiring1.map((s) => ({
      userId: s.userId,
      title: `⚠️ Your ${s.plan} plan expires tomorrow!`,
      type: "SYSTEM",
      message: `Your ${s.plan} subscription expires tomorrow. Renew now to avoid losing access to Pro features.`,
    })),
  ];

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications, skipDuplicates: false });
  }

  return NextResponse.json({
    ok: true,
    sent7day: expiring7.length,
    sent1day: expiring1.length,
    total: notifications.length,
  });
}
