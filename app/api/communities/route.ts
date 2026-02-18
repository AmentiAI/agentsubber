import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "24");

    const slug = searchParams.get("slug");
    const mine = searchParams.get("mine") === "true";

    // ?mine=true — return just the caller's communities for the post composer
    if (mine) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return NextResponse.json({ communities: [] });
      const owned = await prisma.community.findMany({
        where: { ownerUserId: session.user.id, isActive: true },
        select: { id: true, name: true, slug: true, logoUrl: true, logoPosition: true, accentColor: true },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ communities: owned });
    }

    const where: any = { isActive: true };
    if (slug) where.slug = slug;
    if (chain) where.chain = chain;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { twitterHandle: { contains: search, mode: "insensitive" } },
      ];
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          memberAccess: { select: { gateType: true } },
          _count: { select: { giveaways: { where: { status: "ACTIVE" } } } },
        },
        orderBy: [{ verified: "desc" }, { memberCount: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.community.count({ where }),
    ]);

    return NextResponse.json({ communities, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, chain, twitterHandle, discordInvite, telegramLink, websiteUrl } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
    }

    const cleanSlug = slugify(slug);
    if (!cleanSlug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Check plan limits
    const [existingCount, sub] = await Promise.all([
      prisma.community.count({ where: { ownerUserId: session.user.id } }),
      prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    ]);
    const plan = sub?.plan ?? "FREE";
    const limits: Record<string, number> = { FREE: 1, PRO: 5, ELITE: Infinity };
    if (existingCount >= (limits[plan] ?? 1)) {
      return NextResponse.json(
        { error: `Your ${plan} plan allows up to ${limits[plan]} communities. Upgrade to create more.` },
        { status: 403 }
      );
    }

    // Check slug uniqueness
    const slugExists = await prisma.community.findUnique({ where: { slug: cleanSlug } });
    if (slugExists) {
      return NextResponse.json({ error: "This URL is already taken" }, { status: 409 });
    }

    const community = await prisma.community.create({
      data: {
        ownerUserId: session.user.id,
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim(),
        chain: chain ?? "SOL",
        twitterHandle: twitterHandle?.replace("@", "")?.trim() || null,
        discordInvite: discordInvite?.trim() || null,
        telegramLink: telegramLink?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        memberAccess: {
          create: { gateType: "OPEN" },
        },
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "This URL slug is already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
