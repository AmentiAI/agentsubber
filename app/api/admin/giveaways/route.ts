import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Giveaway schema fields: title (not name), totalWinners (not winnersCount),
  // endAt (not endsAt), GiveawayWinner table (not winnerUserIds array)
  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      community: { select: { name: true, slug: true } },
      _count: { select: { entries: true, winners: true } },
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
      include: {
        entries: { select: { id: true, userId: true } },
        winners: { select: { id: true } },
      },
    });
    if (!giveaway) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const entries = giveaway.entries;
    // Filter out already-picked winners
    const alreadyWon = new Set(giveaway.winners.map((w) => w.id));
    const eligible = entries.filter((e) => !alreadyWon.has(e.id));

    const count = Math.min(giveaway.totalWinners - giveaway.winners.length, eligible.length);
    if (count <= 0) return NextResponse.json({ error: "Already drawn or no eligible entries" }, { status: 400 });

    const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, count);

    // Create GiveawayWinner records + notify
    for (const entry of shuffled) {
      await prisma.giveawayWinner.create({
        data: { giveawayId, entryId: entry.id, userId: entry.userId },
      });
      await prisma.notification.create({
        data: {
          userId: entry.userId,
          title: "You won a giveaway! 🎉",
          type: "WIN",
          message: `You won the "${giveaway.title}" giveaway! Check the giveaway page for details.`,
        },
      });
    }

    // Close the giveaway
    await prisma.giveaway.update({
      where: { id: giveawayId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ ok: true, winners: shuffled.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
