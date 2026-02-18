import { prisma } from "./prisma";
import { NextRequest } from "next/server";
import crypto from "crypto";

export function generateApiKey(): string {
  return `cl_${crypto.randomBytes(32).toString("hex")}`;
}

export async function authenticateAgent(request: NextRequest) {
  const apiKey = request.headers.get("X-Agent-Key");
  if (!apiKey) return null;

  const agent = await prisma.openClawAgent.findUnique({
    where: { apiKey, isActive: true },
    include: { user: { include: { wallets: true, subscription: true } } },
  });

  if (!agent) return null;

  // Update last active + request count
  await prisma.openClawAgent.update({
    where: { id: agent.id },
    data: {
      lastActiveAt: new Date(),
      requestCount: { increment: 1 },
    },
  });

  return agent;
}

export async function logAgentActivity(
  agentId: string,
  action: string,
  details?: Record<string, unknown>
) {
  await prisma.agentActivity.create({
    data: { agentId, action, details: details ? JSON.parse(JSON.stringify(details)) : undefined },
  });
}

export const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};
