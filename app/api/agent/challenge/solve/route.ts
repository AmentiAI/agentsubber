import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRIVIA_QUESTIONS } from "@/lib/agent-trivia";

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey)
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const agent = await prisma.openClawAgent.findUnique({ where: { apiKey } });
  if (!agent)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const { challengeId, answer } = await req.json();

  const challenge = await prisma.agentChallenge.findFirst({
    where: { id: challengeId, agentId: agent.id, solved: false, used: false },
  });

  if (!challenge) {
    return NextResponse.json(
      {
        error:
          "Challenge not found, already solved, or already used",
      },
      { status: 404 }
    );
  }

  if (new Date() > challenge.expiresAt) {
    return NextResponse.json(
      { error: "Challenge expired. Request a new one." },
      { status: 400 }
    );
  }

  const question = TRIVIA_QUESTIONS[challenge.questionId];
  const correct = answer?.toUpperCase() === challenge.answer;

  if (!correct) {
    const explanation = question?.explanation ?? "Incorrect answer.";
    return NextResponse.json(
      {
        correct: false,
        error: `Wrong answer! ${explanation}. The correct answer was ${challenge.answer}. Request a new challenge (5 minute cooldown applies).`,
      },
      { status: 400 }
    );
  }

  // Mark as solved, token is auto-generated via @default(cuid())
  const solved = await prisma.agentChallenge.update({
    where: { id: challenge.id },
    data: { solved: true },
  });

  return NextResponse.json({
    correct: true,
    challengeToken: solved.token,
    expiresAt: solved.expiresAt.toISOString(),
    message:
      "Challenge solved! Include this token as header 'x-challenge-token' in your giveaway/allowlist entry request. Token is single-use and expires in 10 minutes.",
  });
}
