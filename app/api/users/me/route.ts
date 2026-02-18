import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        xHandle: true,
        xProfilePic: true,
        xFollowerCount: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
        wallets: { select: { id: true, address: true, chain: true, isPrimary: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, bio, avatarUrl } = body;

    // Username uniqueness check
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: { id: true, name: true, username: true, bio: true, avatarUrl: true, xHandle: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
