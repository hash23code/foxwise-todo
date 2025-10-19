# 📊 Système de Rapports Automatisés - FoxWise ToDo

## 🎯 Vue d'ensemble

Le système de rapports automatisés envoie des statistiques détaillées aux utilisateurs par email:
- **Rapports quotidiens** à 23h tous les jours
- **Rapports mensuels** le 1er de chaque mois à 23h

---

## 🚀 Démarrage Rapide

### 1️⃣ Lire le guide complet
👉 **Ouvre le fichier [`SETUP_RAPPORTS.md`](./SETUP_RAPPORTS.md)** pour le guide étape par étape complet

### 2️⃣ Configuration minimale requise

**Variables d'environnement nécessaires:**
```env
RESEND_API_KEY=re_...          # Pour envoyer les emails
CRON_SECRET=ton_secret_random  # Pour sécuriser les cron jobs
CLERK_SECRET_KEY=sk_...        # Pour récupérer les emails users
NEXT_PUBLIC_APP_URL=https://... # URL de ton app
```

### 3️⃣ Test rapide

Une fois le serveur lancé (`npm run dev`):

```bash
# Tester tous les endpoints
npm run test:cron

# Ou tester individuellement
npm run test:cron:daily    # Rapports quotidiens uniquement
npm run test:cron:monthly  # Rapports mensuels uniquement
```

---

## 📁 Fichiers Importants

### Documentation
- **`SETUP_RAPPORTS.md`** - Guide complet étape par étape 📖
- **`RAPPORTS_README.md`** - Ce fichier (résumé rapide)

### Code
- **`vercel.json`** - Configuration des cron jobs Vercel
- **`app/api/cron/generate-daily-reports/route.ts`** - API rapports quotidiens
- **`app/api/cron/generate-monthly-reports/route.ts`** - API rapports mensuels
- **`app/api/reports/daily/route.ts`** - API pour consulter les rapports quotidiens
- **`app/api/reports/monthly/route.ts`** - API pour consulter les rapports mensuels
- **`app/(dashboard)/reports/page.tsx`** - Page de consultation des rapports

### Outils
- **`test-cron-reports.js`** - Script de test des endpoints 🧪
- **`supabase_add_reports_fields.sql`** - Script SQL pour Supabase 🗄️

---

## 🔧 Configuration Vercel Cron Jobs

Les cron jobs sont configurés dans `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily-reports",
      "schedule": "0 23 * * *"  // 23h tous les jours
    },
    {
      "path": "/api/cron/generate-monthly-reports",
      "schedule": "0 23 1 * *"  // 23h le 1er de chaque mois
    }
  ]
}
```

**Format cron:** `minute hour day month dayOfWeek`

---

## 📧 Aperçu des Emails

### Rapport Quotidien
```
🦊 FoxWise ToDo
Votre Rapport Quotidien

Bonjour [Nom]! 👋
Résumé de votre journée du [Date]

┌─────────────┬─────────────┐
│ Tâches: 10  │ Complétées: 8 │
│ En cours: 2 │ Complétion: 80% │
└─────────────┴─────────────┘

Score de Productivité: 85 ████████░░

[Voir le Dashboard →]
```

### Rapport Mensuel
```
🦊 FoxWise ToDo
Votre Rapport Mensuel

Bonjour [Nom]! 🎉
Récapitulatif de votre mois de [Mois]

┌─────────────────┬──────────────┐
│ Tâches: 120     │ Complétées: 95 │
│ Complétion: 79% │ Heures: 45.5h │
└─────────────────┴──────────────┘

Top Catégories:
▓▓▓▓▓▓▓▓░░ Travail (18h - 40%)
▓▓▓▓▓▓░░░░ Personnel (12h - 27%)
▓▓▓▓░░░░░░ Projets (8h - 18%)

[Voir les Rapports →]
```

---

## 🧪 Tester les Endpoints

### Méthode 1: Script Node.js (Recommandé)
```bash
npm run test:cron
```

### Méthode 2: cURL
```bash
# Test rapport quotidien
curl -X GET http://localhost:3000/api/cron/generate-daily-reports \
  -H "Authorization: Bearer TON_CRON_SECRET"

# Test rapport mensuel
curl -X GET http://localhost:3000/api/cron/generate-monthly-reports \
  -H "Authorization: Bearer TON_CRON_SECRET"
```

### Méthode 3: Interface Vercel (Production)
1. Va dans Vercel Dashboard
2. Settings → Cron Jobs
3. Clique sur "..." → "Trigger" pour déclencher manuellement

---

## 🗄️ Base de Données (Optionnel)

Pour permettre aux users de choisir leurs préférences, exécute ce SQL dans Supabase:

```bash
# Le fichier SQL est fourni
supabase_add_reports_fields.sql
```

Colonnes ajoutées:
- `daily_report_enabled` - Activer/désactiver rapports quotidiens
- `monthly_report_enabled` - Activer/désactiver rapports mensuels
- `daily_report_email` - Envoyer par email (sinon uniquement dans l'app)
- `monthly_report_email` - Envoyer par email (sinon uniquement dans l'app)

---

## 🎨 Fonctionnalités

### Page Reports (`/reports`)
- ✅ Consulter les rapports passés
- ✅ Toggle Quotidien/Mensuel
- ✅ Sélecteur de date/mois
- ✅ Statistiques détaillées avec graphiques
- ✅ Design responsive mobile
- ✅ Bilingue (FR/EN)

### Emails Automatiques
- ✅ Envoi automatique à 23h
- ✅ Design moderne et professionnel
- ✅ Compatible tous clients email
- ✅ Lien direct vers l'application
- ✅ Bilingue selon préférence user

### APIs
- ✅ `/api/reports/daily?date=YYYY-MM-DD` - Consulter rapport quotidien
- ✅ `/api/reports/monthly?year=YYYY&month=MM` - Consulter rapport mensuel
- ✅ `/api/cron/generate-daily-reports` - Générer et envoyer rapports quotidiens
- ✅ `/api/cron/generate-monthly-reports` - Générer et envoyer rapports mensuels

---

## 🔒 Sécurité

- ✅ Endpoints protégés par `CRON_SECRET`
- ✅ Vérification de l'authentification utilisateur
- ✅ Emails envoyés uniquement aux users avec tasks
- ✅ Support des préférences utilisateur (opt-in/opt-out)

---

## 📊 Métriques Calculées

### Score de Productivité
Formule: `(completion_rate × 60%) + (high_priority_completion × 30%) + (task_count × 10%)`

- **≥80%** = Excellent (vert) 🟢
- **≥60%** = Bon (jaune) 🟡
- **<60%** = À améliorer (orange) 🟠

### Statistiques Rapports Quotidiens
- Nombre total de tâches
- Tâches complétées
- Tâches en cours
- Taux de complétion (%)
- Temps par catégorie
- Top 5 priorités
- Score de productivité

### Statistiques Rapports Mensuels
- Total tâches du mois
- Moyenne de complétion
- Heures totales travaillées
- Progression par projet
- Répartition par catégorie (%)
- Tendances (comparaison mois précédent)
- Score de productivité mensuel

---

## 🐛 Problèmes Courants

### "Unauthorized" lors des tests
➡️ Vérifie que `CRON_SECRET` est bien défini dans `.env.local`

### "API key invalid" (Resend)
➡️ Vérifie que `RESEND_API_KEY` commence par `re_`

### Emails non reçus
➡️ Vérifie ton dossier spam
➡️ Si tu utilises `onboarding@resend.dev`, limite de 1 email/jour
➡️ Vérifie les logs Resend: https://resend.com/logs

### Cron jobs ne se déclenchent pas
➡️ Les cron jobs fonctionnent uniquement en **Production** sur Vercel
➡️ Attends l'heure programmée ou déclenche manuellement

---

## 📚 Resources

- [Guide complet de setup](./SETUP_RAPPORTS.md)
- [Documentation Resend](https://resend.com/docs)
- [Documentation Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Documentation Clerk API](https://clerk.com/docs/reference/backend-api)
- [Documentation Supabase](https://supabase.com/docs)

---

## ✅ Checklist Finale

Avant de mettre en production:

- [ ] Compte Resend créé
- [ ] Domaine vérifié dans Resend (ou utilise `onboarding@resend.dev`)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] `CRON_SECRET` généré et ajouté
- [ ] Tests locaux réussis (`npm run test:cron`)
- [ ] Code déployé sur Vercel
- [ ] Cron jobs visibles dans Vercel Dashboard
- [ ] Test manuel en production réussi
- [ ] Email de test reçu

---

## 🎉 C'est Tout!

Si tu suis le guide [`SETUP_RAPPORTS.md`](./SETUP_RAPPORTS.md), tout devrait fonctionner parfaitement!

Pour toute question, consulte les sections de dépannage ou vérifie les logs Vercel.

**Bon courage! 🦊**
