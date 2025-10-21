// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { updateUserSubscription, logPlanChange, getUserSubscription } from '@/lib/subscription';
import { createClient } from '@/lib/supabase';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('📨 Stripe webhook event:', event.type);

    // Traiter les différents événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Gérer la complétion du checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdate(subscription);
}

/**
 * Gérer la mise à jour d'un abonnement
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const customerId = subscription.customer as string;

  // Déterminer le type de plan basé sur le price_id
  let planType: 'pro' | 'premium' = 'pro';
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
    planType = 'premium';
  }

  const status = subscription.status as any;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const supabase = await createClient();

  // Récupérer l'ancien plan pour l'historique
  const oldSub = await getUserSubscription(userId);
  const oldPlan = oldSub?.plan_type || 'free';

  // Mettre à jour ou créer l'abonnement
  const { error } = await (supabase
    .from('user_subscriptions') as any)
    .upsert({
      user_id: userId,
      plan_type: planType,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status,
      trial_end: trialEnd,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error updating subscription in database:', error);
    return;
  }

  // Logger le changement de plan
  if (oldPlan !== planType) {
    await logPlanChange(
      userId,
      oldPlan as any,
      planType,
      subscription.trial_end ? 'trial_started' : 'subscription_started'
    );
  }

  console.log(`✅ Subscription updated for user ${userId}: ${planType}`);
}

/**
 * Gérer la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const oldSub = await getUserSubscription(userId);
  const oldPlan = oldSub?.plan_type || 'free';

  // Revenir au plan gratuit
  await updateUserSubscription(userId, {
    plan_type: 'free',
    status: 'canceled',
    stripe_subscription_id: null,
    stripe_price_id: null,
  } as any);

  // Logger le changement
  await logPlanChange(userId, oldPlan as any, 'free', 'subscription_canceled');

  console.log(`❌ Subscription canceled for user ${userId}`);
}

/**
 * Gérer un paiement réussi
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;

  // Si c'est un paiement pour le plan PRO, incrémenter le compteur
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    const supabase = await createClient();

    // Récupérer le subscription actuel
    const { data: currentSub } = await (supabase
      .from('user_subscriptions') as any)
      .select('pro_subscription_count, premium_bonus_claimed')
      .eq('user_id', userId)
      .single();

    if (currentSub) {
      const newCount = (currentSub.pro_subscription_count || 0) + 1;

      // Incrémenter le compteur
      await (supabase
        .from('user_subscriptions') as any)
        .update({ pro_subscription_count: newCount })
        .eq('user_id', userId);

      console.log(`💰 PRO payment count for user ${userId}: ${newCount}/3`);

      // Si atteint 3 paiements et bonus pas encore réclamé, notifier l'utilisateur
      if (newCount >= 3 && !currentSub.premium_bonus_claimed) {
        console.log(`🎁 User ${userId} is eligible for Premium bonus!`);
        // TODO: Envoyer une notification/email à l'utilisateur
      }
    }
  }
}

/**
 * Gérer un paiement échoué
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // Mettre à jour le statut
  await updateUserSubscription(userId, {
    status: 'past_due',
  } as any);

  console.log(`⚠️ Payment failed for user ${userId}`);
  // TODO: Envoyer un email de notification
}
