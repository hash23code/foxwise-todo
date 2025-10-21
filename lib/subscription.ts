import { createClient } from '@/lib/supabase';

export type PlanType = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  pro_subscription_count: number;
  premium_bonus_claimed: boolean;
  created_at: string;
  updated_at: string;
}

// Features disponibles par plan
export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Tâches illimitées',
      'Day Planner basique',
      'Badges basiques',
    ],
    limits: {
      aiSuggestions: false,
      aiPrioritization: false,
      aiAgent: false,
      voiceAgent: false,
      n8nWorkflows: false,
      advancedAnalytics: false,
    }
  },
  pro: {
    name: 'Pro',
    price: 4.99,
    trialDays: 14,
    features: [
      'Tout de Free +',
      'Suggestions AI pour planification',
      'Auto-priorisation intelligente',
      'Tous les badges débloqués',
      'Analytics avancés',
    ],
    limits: {
      aiSuggestions: true,
      aiPrioritization: true,
      aiAgent: false,
      voiceAgent: false,
      n8nWorkflows: false,
      advancedAnalytics: true,
    }
  },
  premium: {
    name: 'Premium',
    price: 14.99,
    features: [
      'Tout de Pro +',
      '🤖 Agent conversationnel AI',
      '🎙️ Assistant vocal (Vapi)',
      '⚙️ Workflows n8n (emails, intégrations)',
      '📊 Rapports personnalisés',
      '🎯 Support prioritaire',
    ],
    limits: {
      aiSuggestions: true,
      aiPrioritization: true,
      aiAgent: true,
      voiceAgent: true,
      n8nWorkflows: true,
      advancedAnalytics: true,
    }
  }
} as const;

/**
 * Récupère l'abonnement d'un utilisateur
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

  return data;
}

/**
 * Crée un abonnement gratuit pour un nouvel utilisateur
 */
export async function createFreeSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .insert({
      user_id: userId,
      plan_type: 'free',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating free subscription:', error);
    return null;
  }

  return data;
}

/**
 * Obtient le plan actuel d'un utilisateur
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const subscription = await getUserSubscription(userId);

  // Si pas d'abonnement, créer un gratuit
  if (!subscription) {
    const newSub = await createFreeSubscription(userId);
    return newSub?.plan_type || 'free';
  }

  // Si abonnement expiré ou annulé, retourner free
  if (subscription.status === 'canceled' || subscription.status === 'past_due') {
    return 'free';
  }

  return subscription.plan_type;
}

/**
 * Vérifie si un utilisateur a accès à une feature
 */
export async function hasFeatureAccess(userId: string, feature: keyof typeof PLAN_FEATURES.premium.limits): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return PLAN_FEATURES[plan].limits[feature] === true;
}

/**
 * Vérifie si un utilisateur peut commencer un essai gratuit PRO
 */
export async function canStartProTrial(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  // Si jamais eu d'abonnement, peut commencer un essai
  if (!subscription) {
    return true;
  }

  // Si déjà eu un abonnement PRO ou PREMIUM, pas d'essai
  if (subscription.plan_type !== 'free') {
    return false;
  }

  return true;
}

/**
 * Vérifie si un utilisateur est éligible au bonus 1 mois Premium gratuit
 * (après 3 mois de PRO payant)
 */
export async function isEligibleForPremiumBonus(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;

  // Doit être sur plan PRO
  if (subscription.plan_type !== 'pro') return false;

  // Doit avoir payé au moins 3 fois
  if (subscription.pro_subscription_count < 3) return false;

  // Ne doit pas avoir déjà réclamé le bonus
  if (subscription.premium_bonus_claimed) return false;

  return true;
}

/**
 * Incrémente le compteur de paiements PRO
 */
export async function incrementProPaymentCount(userId: string): Promise<void> {
  const supabase = await createClient();

  await (supabase
    .from('user_subscriptions') as any)
    .update({
      pro_subscription_count: (supabase as any).rpc('increment', { field: 'pro_subscription_count' })
    })
    .eq('user_id', userId);
}

/**
 * Enregistre un changement de plan dans l'historique
 */
export async function logPlanChange(
  userId: string,
  fromPlan: PlanType,
  toPlan: PlanType,
  reason: string
): Promise<void> {
  const supabase = await createClient();

  await (supabase
    .from('subscription_history') as any)
    .insert({
      user_id: userId,
      from_plan: fromPlan,
      to_plan: toPlan,
      reason,
    });
}

/**
 * Met à jour l'abonnement d'un utilisateur
 */
export async function updateUserSubscription(
  userId: string,
  updates: Partial<UserSubscription>
): Promise<UserSubscription | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user subscription:', error);
    return null;
  }

  return data;
}
