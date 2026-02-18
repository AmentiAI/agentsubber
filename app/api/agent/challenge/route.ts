import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRandomQuestions } from "@/lib/agent-trivia";

const CHALLENGE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between challenges
const CHALLENGE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes to solve

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey)
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const agent = await prisma.openClawAgent.findUnique({
    where: { apiKey },
  });
  if (!agent)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  // Rate limit: 5 minutes between challenge requests
  if (agent.lastChallengeAt) {
    const elapsed = Date.now() - new Date(agent.lastChallengeAt).getTime();
    if (elapsed < CHALLENGE_COOLDOWN_MS) {
      const waitSec = Math.ceil((CHALLENGE_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        {
          error: `Rate limited. You can request a new challenge in ${waitSec} seconds.`,
          retryAfterSeconds: waitSec,
        },
        { status: 429 }
      );
    }
  }

  const [question] = getRandomQuestions(1);

  // Create challenge record
  const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MS);
  const challenge = await prisma.agentChallenge.create({
    data: {
      agentId: agent.id,
      questionId: question.id,
      answer: question.answer,
      expiresAt,
    },
  });

  // Update last challenge time
  await prisma.openClawAgent.update({
    where: { id: agent.id },
    data: { lastChallengeAt: new Date() },
  });

  return NextResponse.json({
    challengeId: challenge.id,
    question: question.question,
    options: question.options,
    expiresAt: expiresAt.toISOString(),
    instructions:
      "Submit your answer to POST /api/agent/challenge/solve with { challengeId, answer: 'A'|'B'|'C'|'D' }. A correct answer grants a one-time entry token valid for 10 minutes.",
  });
}
