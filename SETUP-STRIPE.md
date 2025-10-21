# 🚀 Configuration Stripe pour FoxWise ToDo

Ce guide explique comment configurer le système d'abonnement Stripe pour FoxWise ToDo.

## 📋 Prérequis

- Un compte Stripe (gratuit): https://dashboard.stripe.com/register
- Node.js et npm installés
- Un compte Supabase actif

---

## 🔧 Étape 1: Configuration Stripe Dashboard

### 1.1 Récupérer les clés API

1. Connectez-vous à https://dashboard.stripe.com
2. Allez dans **Developers** > **API keys**
3. Copiez:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

⚠️ **Important**: Utilisez les clés de **test** pendant le développement!

### 1.2 Créer les produits et prix

1. Allez dans **Products** > **Add Product**

#### Produit PRO ($4.99/mois)
- **Name**: FoxWise Pro
- **Description**: AI-powered productivity features
- **Pricing**:
  - Model: **Recurring**
  - Price: **$4.99 USD**
  - Billing period: **Monthly**
- Cliquez **Save**
- **Copiez le Price ID** (commence par `price_...`) → `STRIPE_PRO_PRICE_ID`

#### Produit PREMIUM ($14.99/mois)
- **Name**: FoxWise Premium
- **Description**: Full AI agent with voice and workflows
- **Pricing**:
  - Model: **Recurring**
  - Price: **$14.99 USD**
  - Billing period: **Monthly**
- Cliquez **Save**
- **Copiez le Price ID** (commence par `price_...`) → `STRIPE_PREMIUM_PRICE_ID`

### 1.3 Configuration du Customer Portal

Le Customer Portal permet aux utilisateurs de gérer leur abonnement (annuler, upgrader, etc.)

1. Allez dans **Settings** > **Billing** > **Customer portal**
2. Cliquez **Activate test link** (ou **Activate live link** pour production)
3. Configurez:
   - ✅ **Allow customers to update their payment methods**
   - ✅ **Allow customers to update subscriptions**
   - ✅ **Allow customers to cancel subscriptions**
4. **Business information**: Remplissez votre nom d'entreprise et email
5. Cliquez **Save**

---

## 🔔 Étape 2: Configuration des Webhooks

Les webhooks permettent à Stripe de notifier votre app des événements (paiements, annulations, etc.)

### 2.1 Pour le développement local (avec Stripe CLI)

1. **Installez Stripe CLI**: https://stripe.com/docs/stripe-cli#install

   ```bash
   # Windows (avec Scoop)
   scoop install stripe

   # macOS (avec Homebrew)
   brew install stripe/stripe-cli/stripe
   ```

2. **Authentifiez-vous**:
   ```bash
   stripe login
   ```

3. **Lancez le webhook listener**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copiez le webhook secret** affiché (commence par `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### 2.2 Pour la production (Vercel)

1. Allez dans **Developers** > **Webhooks**
2. Cliquez **Add endpoint**
3. **Endpoint URL**: `https://votre-domaine.com/api/stripe/webhook`
4. **Events to send**: Sélectionnez ces événements:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Cliquez **Add endpoint**
6. **Copiez le Signing secret** → `STRIPE_WEBHOOK_SECRET` (dans Vercel)

---

## 💾 Étape 3: Configuration de la base de données

### 3.1 Exécuter la migration Supabase

1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet FoxWise ToDo
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase/migrations/create_subscriptions_system.sql`
5. Collez-le dans l'éditeur et cliquez **Run**

Cela va créer:
- Table `user_subscriptions`
- Table `subscription_history`
- Indexes pour les performances
- Row Level Security (RLS) policies

---

## 🔐 Étape 4: Variables d'environnement

### 4.1 Fichier `.env.local` (développement)

Créez un fichier `.env.local` à la racine du projet:

```bash
# Copier .env.example vers .env.local
cp .env.example .env.local
```

Remplissez les valeurs:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 Variables Vercel (production)

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. **Settings** > **Environment Variables**
4. Ajoutez **TOUTES** les variables Stripe (utilisez les clés **LIVE** !)

---

## 🧪 Étape 5: Tester le système

### 5.1 Tester un paiement

1. Lancez l'app en local:
   ```bash
   npm run dev
   ```

2. Dans un autre terminal, lancez le webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Allez sur http://localhost:3000/pricing

4. Cliquez sur "Essayer Pro gratuitement"

5. Utilisez une **carte de test Stripe**:
   - Numéro: `4242 4242 4242 4242`
   - Date: N'importe quelle date future (ex: 12/25)
   - CVC: N'importe quel 3 chiffres (ex: 123)
   - Code postal: N'importe quel code (ex: 12345)

6. Complétez le paiement

7. Vérifiez dans Supabase:
   - Allez dans **Table Editor** > `user_subscriptions`
   - Vous devriez voir votre abonnement avec `plan_type: 'pro'`

### 5.2 Cartes de test supplémentaires

| Carte | Comportement |
|-------|-------------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Paiement refusé |
| `4000 0000 0000 9995` | Paiement nécessite authentification 3D Secure |

Plus de cartes: https://stripe.com/docs/testing

---

## 🎯 Étape 6: Tester le workflow complet

### Scénario 1: Essai gratuit PRO (14 jours)

1. Nouvel utilisateur s'inscrit
2. Va sur `/pricing`
3. Clique sur "Essayer Pro gratuitement"
4. Entre ses infos de paiement
5. ✅ Obtient 14 jours gratuits de PRO
6. Après 14 jours, paiement automatique de $4.99

### Scénario 2: Bonus Premium après 3 mois

1. Utilisateur PRO paie pendant 3 mois consécutifs
2. Un bouton "Réclamer votre mois gratuit Premium" apparaît
3. Il clique dessus
4. ✅ Obtient 1 mois gratuit de Premium ($14.99)
5. Après 30 jours, retour automatique à PRO ou paiement Premium

### Scénario 3: Annulation

1. Utilisateur va sur `/dashboard`
2. Clique sur "Gérer mon abonnement"
3. Redirigé vers Stripe Customer Portal
4. Peut annuler → garde l'accès jusqu'à la fin de la période payée

---

## 📊 Monitorer les paiements

### Dans Stripe Dashboard

1. **Payments**: Voir tous les paiements reçus
2. **Customers**: Voir tous les clients et leurs abonnements
3. **Subscriptions**: Gérer les abonnements actifs
4. **Logs** > **Webhooks**: Voir tous les événements envoyés

### Dans Supabase

- **Table `user_subscriptions`**: État actuel de chaque utilisateur
- **Table `subscription_history`**: Historique des changements de plan

---

## 🚨 Résolution de problèmes

### Webhook ne fonctionne pas

**Symptôme**: Les abonnements ne se créent pas dans Supabase

**Solution**:
1. Vérifiez que le Stripe CLI est lancé
2. Vérifiez le `STRIPE_WEBHOOK_SECRET` dans `.env.local`
3. Regardez les logs dans le terminal du webhook listener

### Paiement échoue

**Symptôme**: Erreur lors du checkout

**Solution**:
1. Vérifiez les clés API (Publishable et Secret)
2. Vérifiez que les Price IDs sont corrects
3. Regardez les logs dans `/api/stripe/create-checkout`

### Row Level Security (RLS) bloque l'accès

**Symptôme**: Erreur 401 ou données vides

**Solution**:
1. Vérifiez que Clerk `userId` est bien passé aux APIs
2. Vérifiez les policies RLS dans Supabase
3. Testez la query directement dans Supabase SQL Editor

---

## 📝 Notes importantes

1. **Mode Test vs Live**:
   - Toujours développer avec les clés **test** (`sk_test_...`)
   - Basculer vers **live** (`sk_live_...`) seulement pour la production

2. **Sécurité**:
   - Ne JAMAIS committer `.env.local` sur Git
   - Ne JAMAIS exposer `STRIPE_SECRET_KEY` côté client

3. **Coûts**:
   - Stripe prend 2.9% + $0.30 par transaction réussie
   - Pas de frais mensuels

4. **Conformité**:
   - Stripe gère automatiquement la conformité PCI
   - Vous n'avez jamais accès aux numéros de carte

---

## ✅ Checklist de lancement

Avant de mettre en production:

- [ ] Clés API **LIVE** configurées dans Vercel
- [ ] Webhook configuré avec URL production
- [ ] Produits et prix vérifiés dans Stripe Dashboard
- [ ] Customer Portal activé en mode LIVE
- [ ] Migration Supabase exécutée en production
- [ ] Test d'un paiement réel (petite somme)
- [ ] Vérification des emails Stripe (confirmations)
- [ ] Politique de remboursement définie
- [ ] Conditions d'utilisation et politique de confidentialité à jour

---

## 🆘 Besoin d'aide?

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Discord FoxWise**: [Lien vers votre Discord]

---

**Bonne chance avec FoxWise ToDo! 🦊✨**
