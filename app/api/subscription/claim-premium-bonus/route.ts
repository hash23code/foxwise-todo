import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserSubscription,
  isEligibleForPremiumBonus,
  updateUserSubscription,
  logPlanChange,
} from '@/lib/subscription';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';

/**
 * POST - Réclamer le bonus 1 mois Premium gratuit après 3 mois de PRO
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier l'éligibilité
    const eligible = await isEligibleForPremiumBonus(userId);

    if (!eligible) {
      return NextResponse.json(
        { error: 'Not eligible for Premium bonus' },
        { status: 403 }
      );
    }

    const subscription = await getUserSubscription(userId);

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Passer l'abonnement à Premium avec 1 mois de trial gratuit
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Mettre à jour la subscription Stripe pour passer à Premium avec trial
    const now = Math.floor(Date.now() / 1000);
    const oneMonthFromNow = now + (30 * 24 * 60 * 60); // 30 jours

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: STRIPE_PLANS.premium.priceId,
          },
        ],
        trial_end: oneMonthFromNow,
        proration_behavior: 'none', // Pas de facturation immédiate
      }
    );

    // Mettre à jour la base de données
    await updateUserSubscription(userId, {
      plan_type: 'premium',
      stripe_price_id: STRIPE_PLANS.premium.priceId,
      premium_bonus_claimed: true,
      trial_end: new Date(oneMonthFromNow * 1000).toISOString(),
      status: 'trialing',
    } as any);

    // Logger le changement
    await logPlanChange(userId, 'pro', 'premium', 'loyalty_bonus_claimed');

    console.log(`🎁 Premium bonus claimed by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Premium bonus activated! Enjoy 1 month free.',
      subscription: updatedSubscription,
    });

  } catch (error) {
    console.error('Error claiming Premium bonus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
