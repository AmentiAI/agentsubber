import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { xHandle: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, xHandle: true, email: true, image: true, createdAt: true, banned: true,
        subscription: { select: { plan: true, createdAt: true } },
        _count: { select: { ownedCommunities: true, giveawayEntries: true, wallets: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, action, plan } = await req.json();

  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: true } });
    return NextResponse.json({ ok: true });
  }
  if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: false } });
    return NextResponse.json({ ok: true });
  }
  if (action === "set_plan" && plan) {
    // SubscriptionPlan enum: FREE | PRO | ELITE
    const planVal = plan as "FREE" | "PRO" | "ELITE";
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, plan: planVal, status: "active" },
      update: { plan: planVal },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { userId } = await req.json();
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
