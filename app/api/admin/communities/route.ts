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

  const where: any = search ? { name: { contains: search, mode: "insensitive" } } : {};

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { name: true, xHandle: true } },
        _count: { select: { giveaways: true, allowlistCampaigns: true, presales: true, followers: true } },
      },
    }),
    prisma.community.count({ where }),
  ]);

  return NextResponse.json({ communities, total, pages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { communityId } = await req.json();
  await prisma.community.delete({ where: { id: communityId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { communityId, featured } = await req.json();
  // featured flag — add to Community if not already there
  await prisma.community.update({ where: { id: communityId }, data: { featured } });
  return NextResponse.json({ ok: true });
}
