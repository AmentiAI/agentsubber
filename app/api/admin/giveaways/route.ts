import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      community: { select: { name: true, slug: true } },
      _count: { select: { entries: true } },
    },
  });

  return NextResponse.json({ giveaways });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { giveawayId } = await req.json();
  await prisma.giveaway.delete({ where: { id: giveawayId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { giveawayId, action } = await req.json();

  if (action === "draw") {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
      include: { entries: { select: { id: true, userId: true } } },
    });
    if (!giveaway) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const entries = giveaway.entries;
    const count = Math.min(giveaway.winnersCount, entries.length);
    const shuffled = entries.sort(() => Math.random() - 0.5).slice(0, count);

    await prisma.giveaway.update({
      where: { id: giveawayId },
      data: {
        status: "CLOSED",
        winnerUserIds: shuffled.map((e) => e.userId),
      },
    });

    // Send notifications to winners
    for (const entry of shuffled) {
      await prisma.notification.create({
        data: {
          userId: entry.userId,
          type: "WIN",
          message: `🎉 You won the "${giveaway.name}" giveaway!`,
        },
      });
    }

    return NextResponse.json({ ok: true, winners: shuffled.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
