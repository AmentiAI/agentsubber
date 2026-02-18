import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ following: false });
  const { id } = await params;

  try {
    const existing = await prisma.communityFollow.findFirst({
      where: { communityId: id, userId: session.user.id },
    });
    return NextResponse.json({ following: !!existing });
  } catch {
    return NextResponse.json({ following: false });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.communityFollow.findFirst({
      where: { communityId: id, userId: session.user.id },
    });
    if (existing) {
      await prisma.communityFollow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    } else {
      await prisma.communityFollow.create({
        data: { communityId: id, userId: session.user.id },
      });
      return NextResponse.json({ following: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
