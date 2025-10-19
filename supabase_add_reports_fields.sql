-- Script SQL pour ajouter les champs de rapports à la table user_settings
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour les préférences de rapports
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS daily_report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_report_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_report_email BOOLEAN DEFAULT false;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN user_settings.daily_report_enabled IS 'Activer/désactiver les rapports quotidiens pour cet utilisateur';
COMMENT ON COLUMN user_settings.monthly_report_enabled IS 'Activer/désactiver les rapports mensuels pour cet utilisateur';
COMMENT ON COLUMN user_settings.daily_report_email IS 'Envoyer les rapports quotidiens par email (si false, seulement dans l''app)';
COMMENT ON COLUMN user_settings.monthly_report_email IS 'Envoyer les rapports mensuels par email (si false, seulement dans l''app)';

-- Mettre à jour les utilisateurs existants (activer les rapports par défaut, mais pas l'email)
UPDATE user_settings
SET
  daily_report_enabled = COALESCE(daily_report_enabled, true),
  monthly_report_enabled = COALESCE(monthly_report_enabled, true),
  daily_report_email = COALESCE(daily_report_email, false),
  monthly_report_email = COALESCE(monthly_report_email, false);

-- Afficher les colonnes mises à jour
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name IN ('daily_report_enabled', 'monthly_report_enabled', 'daily_report_email', 'monthly_report_email');
