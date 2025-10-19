# Guide de Configuration - Système de Rapports Automatisés

Ce guide te permet de configurer complètement le système de rapports quotidiens et mensuels pour FoxWise ToDo.

---

## 📋 Prérequis

- [ ] Compte Vercel avec projet déployé
- [ ] Compte Supabase avec base de données configurée
- [ ] Compte Clerk pour l'authentification
- [ ] Accès au code de l'application

---

## Étape 1: Créer un compte Resend (Envoi d'emails)

### 1.1 Inscription à Resend

1. Va sur **https://resend.com**
2. Clique sur **"Sign Up"** ou **"Get Started"**
3. Crée un compte avec ton email
4. Confirme ton email

### 1.2 Obtenir ta clé API

1. Une fois connecté, va dans **"API Keys"** dans le menu
2. Clique sur **"Create API Key"**
3. Donne-lui un nom: `FoxWise ToDo Production`
4. **Copie la clé API** (elle commence par `re_...`)
5. ⚠️ **IMPORTANT:** Sauvegarde cette clé dans un endroit sûr (tu ne pourras plus la voir après)

### 1.3 Vérifier ton domaine (Optionnel mais recommandé)

**Option A - Utiliser le domaine de test de Resend (pour démarrer):**
- Resend te donne `onboarding@resend.dev` pour tester
- Limite: 1 email par jour
- Parfait pour tester

**Option B - Ajouter ton propre domaine (pour production):**
1. Va dans **"Domains"** dans Resend
2. Clique sur **"Add Domain"**
3. Entre ton domaine (ex: `foxwise-todo.com`)
4. Ajoute les enregistrements DNS fournis par Resend chez ton hébergeur:
   - **SPF** (TXT)
   - **DKIM** (TXT)
   - **DMARC** (TXT)
5. Attends la vérification (peut prendre 24-48h)

---

## Étape 2: Configurer les Variables d'Environnement sur Vercel

### 2.1 Générer un CRON_SECRET

1. Ouvre un terminal ou utilise un générateur en ligne
2. Génère un secret aléatoire sécurisé:
   ```bash
   # Option 1: Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Option 2: OpenSSL
   openssl rand -hex 32

   # Option 3: Site web
   # Va sur https://www.uuidgenerator.net/
   ```
3. **Copie le résultat** (ex: `a1b2c3d4e5f6...`)

### 2.2 Ajouter les variables sur Vercel

1. Va sur **https://vercel.com**
2. Sélectionne ton projet **FoxWise ToDo**
3. Va dans **Settings** → **Environment Variables**
4. Ajoute ces variables **une par une**:

| Nom de la Variable | Valeur | Environnement |
|-------------------|---------|---------------|
| `CRON_SECRET` | Le secret que tu as généré | Production, Preview, Development |
| `RESEND_API_KEY` | Ta clé Resend (commence par `re_...`) | Production, Preview, Development |
| `CLERK_SECRET_KEY` | Ta clé Clerk (déjà configurée normalement) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://ton-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-url.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

**Comment ajouter une variable:**
1. Clique sur **"Add New"**
2. Entre le **nom** de la variable
3. Entre la **valeur**
4. Sélectionne les environnements (Production, Preview, Development)
5. Clique sur **"Save"**

### 2.3 Ajouter les variables en local (.env.local)

1. Ouvre le fichier `.env.local` à la racine du projet
2. Ajoute ces lignes (si elles n'existent pas déjà):

```env
# Resend API pour l'envoi d'emails
RESEND_API_KEY=re_ton_api_key_ici

# Secret pour les cron jobs
CRON_SECRET=ton_secret_genere_ici

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk (déjà configuré normalement)
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase (déjà configuré normalement)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

3. **Sauvegarde le fichier**

---

## Étape 3: Mettre à jour la table user_settings dans Supabase (Optionnel)

Cette étape permet aux utilisateurs de choisir s'ils veulent recevoir les rapports.

### 3.1 Accéder à Supabase

1. Va sur **https://supabase.com**
2. Sélectionne ton projet **FoxWise ToDo**
3. Va dans **SQL Editor** (dans le menu de gauche)

### 3.2 Ajouter les colonnes pour les rapports

1. Clique sur **"New Query"**
2. Copie et colle ce SQL:

```sql
-- Ajouter les colonnes pour les préférences de rapports
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS daily_report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_report_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_report_email BOOLEAN DEFAULT false;

-- Mettre à jour les utilisateurs existants (activer les rapports par défaut)
UPDATE user_settings
SET
  daily_report_enabled = true,
  monthly_report_enabled = true,
  daily_report_email = false,
  monthly_report_email = false
WHERE daily_report_enabled IS NULL;
```

3. Clique sur **"Run"** (ou appuie sur Ctrl+Enter)
4. Tu devrais voir **"Success"**

### 3.3 Vérifier que ça fonctionne

1. Va dans **Table Editor** → **user_settings**
2. Vérifie que les nouvelles colonnes apparaissent:
   - `daily_report_enabled`
   - `monthly_report_enabled`
   - `daily_report_email`
   - `monthly_report_email`

---

## Étape 4: Mettre à jour le code pour utiliser les préférences (Optionnel)

Les endpoints de cron sont déjà prêts, mais ils sont commentés pour le moment. Pour activer la vérification des préférences:

### 4.1 Éditer generate-daily-reports/route.ts

Trouve cette ligne (vers la ligne 53):
```typescript
// if (!settings?.daily_report_enabled) continue;
```

Décommente-la:
```typescript
if (!settings?.daily_report_enabled) continue;
```

### 4.2 Éditer generate-monthly-reports/route.ts

Trouve cette ligne (vers la ligne 51):
```typescript
// if (!settings?.monthly_report_enabled) continue;
```

Décommente-la:
```typescript
if (!settings?.monthly_report_enabled) continue;
```

---

## Étape 5: Modifier l'adresse email d'envoi

### 5.1 Avec le domaine de test Resend

Dans ces fichiers, remplace `noreply@yourdomain.com` par `onboarding@resend.dev`:

**Fichiers à modifier:**
- `app/api/cron/generate-daily-reports/route.ts` (ligne ~85)
- `app/api/cron/generate-monthly-reports/route.ts` (ligne ~113)
- `app/api/send-reminders/route.ts` (ligne 72)

**Avant:**
```typescript
from: 'FoxWise ToDo <noreply@yourdomain.com>',
```

**Après:**
```typescript
from: 'FoxWise ToDo <onboarding@resend.dev>',
```

### 5.2 Avec ton propre domaine vérifié

Si tu as vérifié ton domaine dans Resend:

```typescript
from: 'FoxWise ToDo <noreply@foxwise-todo.com>',
```

---

## Étape 6: Tester les endpoints en local

### 6.1 Démarrer le serveur de développement

```bash
npm run dev
```

### 6.2 Tester l'endpoint des rapports quotidiens

Ouvre un nouveau terminal et exécute:

```bash
curl -X GET http://localhost:3000/api/cron/generate-daily-reports \
  -H "Authorization: Bearer TON_CRON_SECRET_ICI"
```

Remplace `TON_CRON_SECRET_ICI` par le secret que tu as généré.

**Réponse attendue:**
```json
{
  "message": "Daily reports processed",
  "sent": 1,
  "total": 1
}
```

### 6.3 Tester l'endpoint des rapports mensuels

```bash
curl -X GET http://localhost:3000/api/cron/generate-monthly-reports \
  -H "Authorization: Bearer TON_CRON_SECRET_ICI"
```

**Réponse attendue:**
```json
{
  "message": "Monthly reports processed",
  "sent": 1,
  "total": 1,
  "month": "2025-09"
}
```

### 6.4 Vérifier les emails

1. Vérifie ta boîte email
2. Tu devrais avoir reçu les rapports
3. Vérifie aussi le dossier spam

---

## Étape 7: Déployer sur Vercel

### 7.1 Commiter et pusher les modifications

```bash
# Vérifier les modifications
git status

# Ajouter tous les fichiers modifiés
git add .

# Créer un commit
git commit -m "Update email sender address for reports"

# Push vers GitHub
git push origin main
```

### 7.2 Déploiement automatique

1. Vercel va automatiquement détecter le push
2. Le déploiement démarre automatiquement
3. Va sur **Vercel Dashboard** → Ton projet
4. Attends que le déploiement soit **"Ready"** (✅)

### 7.3 Vérifier que les cron jobs sont actifs

1. Dans Vercel Dashboard, va dans ton projet
2. Va dans **Settings** → **Cron Jobs**
3. Tu devrais voir:
   - ✅ `/api/send-reminders` - `0 9 * * *`
   - ✅ `/api/cron/generate-daily-reports` - `0 23 * * *`
   - ✅ `/api/cron/generate-monthly-reports` - `0 23 1 * *`

---

## Étape 8: Tester les cron jobs en production

### 8.1 Déclencher manuellement un cron job

Vercel permet de déclencher manuellement les cron jobs pour tester:

1. Va dans **Settings** → **Cron Jobs**
2. Clique sur **"..."** à côté d'un cron job
3. Clique sur **"Trigger"** ou **"Run Now"**
4. Vérifie les logs pour voir si ça fonctionne

**Ou via l'API:**

```bash
curl -X GET https://ton-app.vercel.app/api/cron/generate-daily-reports \
  -H "Authorization: Bearer TON_CRON_SECRET_ICI"
```

### 8.2 Vérifier les logs

1. Va dans **Deployments** sur Vercel
2. Clique sur le dernier déploiement
3. Va dans **Functions** → Trouve ton endpoint
4. Clique dessus pour voir les logs
5. Vérifie qu'il n'y a pas d'erreurs

---

## Étape 9: Tester avec un utilisateur réel

### 9.1 Créer une tâche pour aujourd'hui

1. Connecte-toi à l'application
2. Va dans **Tasks** ou **Day Planner**
3. Crée une tâche avec la date d'aujourd'hui
4. Marque-la comme complétée

### 9.2 Attendre 23h ou déclencher manuellement

**Option A - Attendre 23h:**
- Les rapports seront envoyés automatiquement à 23h

**Option B - Déclencher maintenant:**
- Utilise la méthode de l'étape 8.1 pour déclencher manuellement

### 9.3 Vérifier l'email reçu

1. Vérifie ta boîte email
2. Tu devrais recevoir un bel email avec:
   - 📊 Statistiques de la journée
   - 📈 Score de productivité
   - 🎨 Design moderne
   - 🔗 Bouton vers le dashboard

---

## 🎯 Checklist Finale

Avant de considérer que tout est fonctionnel, vérifie:

- [ ] Compte Resend créé et clé API copiée
- [ ] Domaine vérifié dans Resend (ou utilise `onboarding@resend.dev`)
- [ ] CRON_SECRET généré
- [ ] Variables d'environnement ajoutées sur Vercel
- [ ] Variables d'environnement ajoutées dans `.env.local`
- [ ] Table `user_settings` mise à jour dans Supabase (optionnel)
- [ ] Adresse email d'envoi modifiée dans le code
- [ ] Tests locaux réussis (curl)
- [ ] Code commité et pushé sur GitHub
- [ ] Déploiement Vercel réussi
- [ ] Cron jobs visibles dans Vercel Dashboard
- [ ] Test manuel d'un cron job réussi
- [ ] Email de test reçu

---

## 🐛 Dépannage

### Problème: "Unauthorized" lors du test des endpoints

**Solution:**
- Vérifie que tu utilises le bon `CRON_SECRET`
- Vérifie que le header `Authorization: Bearer TON_SECRET` est correct
- Vérifie que la variable est bien définie dans `.env.local` (local) ou Vercel (prod)

### Problème: Erreur Resend "API key invalid"

**Solution:**
- Vérifie que ta clé commence par `re_`
- Vérifie qu'elle est bien définie dans les variables d'environnement
- Génère une nouvelle clé si nécessaire sur resend.com

### Problème: "Failed to fetch user from Clerk"

**Solution:**
- Vérifie que `CLERK_SECRET_KEY` est bien défini
- Vérifie qu'elle commence par `sk_`
- Va dans Clerk Dashboard → API Keys pour vérifier

### Problème: Les emails ne sont pas envoyés

**Solution:**
- Vérifie que l'adresse `from` est correcte
- Si tu utilises `onboarding@resend.dev`, tu es limité à 1 email/jour
- Vérifie les logs Resend: https://resend.com/logs
- Vérifie ton dossier spam

### Problème: Les cron jobs ne se déclenchent pas

**Solution:**
- Les cron jobs Vercel ne fonctionnent qu'en **Production**
- Assure-toi que ton site est déployé sur Vercel
- Vérifie que `vercel.json` est bien à la racine du projet
- Attends l'heure programmée ou déclenche manuellement

### Problème: "No users with tasks today"

**Solution:**
- C'est normal si aucun utilisateur n'a de tâches aujourd'hui
- Crée une tâche avec la date d'aujourd'hui pour tester

---

## 📚 Ressources

- **Resend Documentation:** https://resend.com/docs
- **Vercel Cron Jobs:** https://vercel.com/docs/cron-jobs
- **Supabase SQL Editor:** https://supabase.com/docs/guides/database
- **Clerk API Reference:** https://clerk.com/docs/reference/backend-api

---

## 🎉 Félicitations!

Si tu as suivi toutes les étapes, ton système de rapports automatisés est maintenant fonctionnel!

Les utilisateurs recevront:
- 📧 Un rapport quotidien à 23h tous les jours
- 📧 Un rapport mensuel le 1er de chaque mois à 23h

Pour toute question, consulte les logs Vercel ou vérifie les étapes ci-dessus.
