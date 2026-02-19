import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Send a notification to ALL users or specific users
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { message, type = "SYSTEM", userIds } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  let targets: string[];
  if (userIds?.length) {
    targets = userIds;
  } else {
    const all = await prisma.user.findMany({ select: { id: true } });
    targets = all.map((u) => u.id);
  }

  // Batch create notifications
  await prisma.notification.createMany({
    data: targets.map((userId) => ({
      userId,
      title: "Platform Announcement",
      type,
      message,
      read: false,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, sent: targets.length });
}
