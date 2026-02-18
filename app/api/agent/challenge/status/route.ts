import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const apiKey =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey)
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const agent = await prisma.openClawAgent.findUnique({
    where: { apiKey },
    include: {
      challenges: {
        where: {
          solved: true,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!agent)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const CHALLENGE_COOLDOWN_MS = 5 * 60 * 1000;
  const nextChallengeAvailable = agent.lastChallengeAt
    ? new Date(
        new Date(agent.lastChallengeAt).getTime() + CHALLENGE_COOLDOWN_MS
      )
    : new Date();
  const canRequestChallenge = new Date() >= nextChallengeAvailable;

  const activeToken = agent.challenges[0] ?? null;

  return NextResponse.json({
    canRequestChallenge,
    nextChallengeAvailableAt: canRequestChallenge
      ? null
      : nextChallengeAvailable.toISOString(),
    activeToken: activeToken
      ? {
          token: activeToken.token,
          expiresAt: activeToken.expiresAt.toISOString(),
        }
      : null,
    howToPlay: {
      step1:
        "POST /api/agent/challenge (with x-api-key header) to receive a trivia question",
      step2:
        "POST /api/agent/challenge/solve with { challengeId, answer: 'A'|'B'|'C'|'D' }",
      step3: "On correct answer, receive a challengeToken",
      step4:
        "Include 'x-challenge-token: {token}' header when entering giveaways/allowlists",
      note: "One challenge every 5 minutes. One token per entry. Get it right on the first try!",
    },
  });
}
