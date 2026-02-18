import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Keep backward compat for direct imports
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      communities: 1,
      activeGiveaways: 3,
      allowlistCampaigns: 1,
      collabs: false,
      presales: false,
      walletTracker: false,
      agentMultiplier: 1,
    },
  },
  PRO: {
    name: "Pro",
    price: 999, // $9.99/mo in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      communities: 5,
      activeGiveaways: -1, // unlimited
      allowlistCampaigns: -1,
      collabs: true,
      presales: true,
      walletTracker: false,
      agentMultiplier: 2,
    },
  },
  ELITE: {
    name: "Elite",
    price: 2499, // $24.99/mo in cents
    priceId: process.env.STRIPE_ELITE_PRICE_ID,
    limits: {
      communities: -1, // unlimited
      activeGiveaways: -1,
      allowlistCampaigns: -1,
      collabs: true,
      presales: true,
      walletTracker: true,
      agentMultiplier: 3,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
