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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        community: { select: { ownerUserId: true, name: true } },
        winners: {
          include: {
            entry: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    xHandle: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (giveaway.community.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Format winners data
    const winnersData = giveaway.winners.map((winner, index) => ({
      position: index + 1,
      userId: winner.entry.user.id,
      name: winner.entry.user.name || "N/A",
      email: winner.entry.user.email || "N/A",
      xHandle: winner.entry.user.xHandle ? `@${winner.entry.user.xHandle}` : "N/A",
      walletAddress: winner.entry.walletAddress || "N/A",
      discordUsername: winner.entry.discordUsername || "N/A",
      telegramUsername: winner.entry.telegramUsername || "N/A",
      drawnAt: new Date(winner.drawnAt).toISOString(),
    }));

    const { searchParams } = new URL(_request.url);
    const format = searchParams.get("format") || "json";

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Position",
        "User ID",
        "Name",
        "Email",
        "X Handle",
        "Wallet Address",
        "Discord Username",
        "Telegram Username",
        "Drawn At",
      ];

      const csvRows = winnersData.map((w) => [
        w.position,
        w.userId,
        w.name,
        w.email,
        w.xHandle,
        w.walletAddress,
        w.discordUsername,
        w.telegramUsername,
        w.drawnAt,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${giveaway.community.name}-giveaway-winners.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      giveaway: {
        id: giveaway.id,
        title: giveaway.title,
        community: giveaway.community.name,
        totalWinners: giveaway.totalWinners,
      },
      winners: winnersData,
    });
  } catch (error: any) {
    console.error("[Winners Export Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
