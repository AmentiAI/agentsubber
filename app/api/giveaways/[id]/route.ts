import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, slug: true, logoUrl: true, chain: true, ownerUserId: true } },
        _count: { select: { entries: true, winners: true } },
        winners: {
          include: {
            entry: {
              include: { user: { select: { id: true, name: true, xHandle: true } } },
            },
          },
        },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ giveaway });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { community: { select: { ownerUserId: true } } },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (giveaway.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await prisma.giveaway.update({
      where: { id },
      data: {
        status: body.status,
        title: body.title,
        description: body.description,
        prize: body.prize,
        endAt: body.endAt ? new Date(body.endAt) : undefined,
      },
    });

    return NextResponse.json({ giveaway: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { community: { select: { ownerUserId: true } } },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (giveaway.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.giveaway.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
