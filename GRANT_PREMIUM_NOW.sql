-- 🎉 SCRIPT POUR OBTENIR TON ACCÈS PREMIUM À VIE 🎉
-- Copie-colle ce script complet dans Supabase SQL Editor et clique "Run"

-- Étape 1: Créer la table user_subscriptions si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  pro_subscription_count INTEGER DEFAULT 0,
  premium_bonus_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Étape 2: Créer les index
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_type ON user_subscriptions(plan_type);

-- Étape 3: Activer RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Étape 4: Créer les policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;

CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Étape 5: Créer la fonction de mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Étape 6: Créer le trigger
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Étape 7: Table d'historique
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  from_plan TEXT NOT NULL,
  to_plan TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own history" ON subscription_history;
CREATE POLICY "Users can view their own history"
  ON subscription_history FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 🎁🎁🎁 ÉTAPE 8: TE DONNER L'ACCÈS PREMIUM À VIE! 🎁🎁🎁
INSERT INTO user_subscriptions (
  user_id,
  plan_type,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  premium_bonus_claimed
) VALUES (
  'user_33vzjdFZIcUKh8AnZnK7xZamLMA',
  'premium',
  'lifetime_premium_founder',
  'lifetime_premium_founder',
  'lifetime_premium',
  'active',
  NOW(),
  '2099-12-31 23:59:59'::timestamp, -- Premium jusqu'en 2099! 🚀
  false,
  true
)
ON CONFLICT (user_id)
DO UPDATE SET
  plan_type = 'premium',
  stripe_customer_id = 'lifetime_premium_founder',
  stripe_subscription_id = 'lifetime_premium_founder',
  stripe_price_id = 'lifetime_premium',
  status = 'active',
  current_period_end = '2099-12-31 23:59:59'::timestamp,
  cancel_at_period_end = false,
  premium_bonus_claimed = true,
  updated_at = NOW();

-- Ajouter un enregistrement dans l'historique
INSERT INTO subscription_history (user_id, from_plan, to_plan, reason)
VALUES ('user_33vzjdFZIcUKh8AnZnK7xZamLMA', 'free', 'premium', 'lifetime_founder_access');

-- 🎉 VÉRIFICATION - Tu devrais voir ton abonnement premium!
SELECT
  user_id,
  plan_type,
  status,
  current_period_end,
  'Premium jusqu''en ' || TO_CHAR(current_period_end, 'YYYY') || '! 🎉' as message
FROM user_subscriptions
WHERE user_id = 'user_33vzjdFZIcUKh8AnZnK7xZamLMA';
