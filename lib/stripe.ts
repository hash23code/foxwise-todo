import Stripe from 'stripe';

// En développement, si Stripe n'est pas configuré, utiliser une clé dummy
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_dev_mode';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe features will not work until configured.');
  console.warn('📚 See SETUP-STRIPE.md for configuration instructions.');
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// IDs des produits Stripe (à configurer dans Stripe Dashboard)
export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!, // $4.99/mois
    name: 'Pro',
    amount: 499, // en cents
  },
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!, // $14.99/mois
    name: 'Premium',
    amount: 1499, // en cents
  },
} as const;

/**
 * Crée un client Stripe pour un utilisateur
 */
export async function createStripeCustomer(
  email: string,
  userId: string,
  name?: string
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
    name,
  });

  return customer;
}

/**
 * Crée une session de checkout Stripe
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  trialDays?: number
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      userId,
    },
    subscription_data: trialDays
      ? {
          trial_period_days: trialDays,
          metadata: {
            userId,
          },
        }
      : {
          metadata: {
            userId,
          },
        },
  });

  return session;
}

/**
 * Crée une session de portail client Stripe
 */
export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return session;
}

/**
 * Récupère une subscription Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Annule une subscription Stripe
 */
export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

/**
 * Réactive une subscription annulée
 */
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  return subscription;
}

/**
 * Change le plan d'une subscription
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice', // Facturer immédiatement la différence
  });

  return updatedSubscription;
}
