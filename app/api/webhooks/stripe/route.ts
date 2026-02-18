import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as "PRO" | "ELITE";
        if (userId && plan && session.subscription) {
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubId: session.subscription as string,
              plan,
              status: "active",
            },
            update: {
              stripeSubId: session.subscription as string,
              plan,
              status: "active",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
        });
        if (existingSub) {
          const plan =
            sub.items.data[0]?.price?.id === process.env.STRIPE_ELITE_PRICE_ID
              ? "ELITE"
              : "PRO";
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: sub.status,
              plan: sub.status === "active" ? plan : existingSub.plan,
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: "canceled", plan: "FREE" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

