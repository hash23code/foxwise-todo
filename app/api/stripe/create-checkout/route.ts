// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createStripeCustomer, createCheckoutSession, STRIPE_PLANS } from '@/lib/stripe';
import { getUserSubscription, canStartProTrial } from '@/lib/subscription';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body; // 'pro' ou 'premium'

    if (!plan || (plan !== 'pro' && plan !== 'premium')) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Récupérer l'email de l'utilisateur depuis Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà un abonnement
    let subscription = await getUserSubscription(userId);
    let stripeCustomerId = subscription?.stripe_customer_id;

    // Si pas de customer Stripe, en créer un
    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(
        email,
        userId,
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : undefined
      );
      stripeCustomerId = customer.id;
    }

    // Déterminer si l'utilisateur peut avoir un essai gratuit
    let trialDays: number | undefined;

    if (plan === 'pro') {
      const canTrial = await canStartProTrial(userId);
      if (canTrial) {
        trialDays = 14; // 14 jours d'essai gratuit pour PRO
      }
    }

    // Créer la session de checkout
    const priceId = STRIPE_PLANS[plan].priceId;
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      userId,
      trialDays
    );

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
