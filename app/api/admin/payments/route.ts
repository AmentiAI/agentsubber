import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // PaymentRecord fields: id, userId, plan, chain, txHash, amountUSD (not amountUsd),
  // expectedAmountRaw, txHashSubmitted, status, memo, createdAt, confirmedAt
  const payments = await prisma.paymentRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, xHandle: true } } },
  });

  return NextResponse.json({ payments });
}
