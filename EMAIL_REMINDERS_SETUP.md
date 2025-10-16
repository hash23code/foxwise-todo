# Email Reminders Setup Guide

Ce guide vous aidera à configurer les reminders par email pour FoxWise ToDo.

## Configuration complète

Toutes les fonctionnalités sont déjà implémentées! Voici ce qui a été fait:

### ✅ Fonctionnalités implémentées:
1. **Interface utilisateur** - Checkbox pour activer les reminders dans le formulaire de création de tâche
2. **API des reminders** - `/api/task-reminders` pour gérer les reminders
3. **Envoi d'emails** - `/api/send-reminders` avec beaux templates HTML
4. **Cron job Vercel** - Configuration automatique pour envoyer les emails quotidiennement

### 📋 Ce qu'il vous reste à faire:

#### 1. Créer un compte Resend (GRATUIT)
- Allez sur https://resend.com
- Créez un compte (3000 emails/mois gratuits)
- Obtenez votre clé API

#### 2. Ajouter les variables d'environnement
Dans votre `.env.local` et dans Vercel:

```env
RESEND_API_KEY=re_votre_cle_api
CRON_SECRET=votre_secret_aleatoire
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

#### 3. Déployer sur Vercel
Le cron job sera automatiquement configuré! Il s'exécutera tous les jours à 9h00 AM UTC.

### 🎨 Email Template
Les emails envoyés sont magnifiques avec:
- En-tête gradient violet FoxWise
- Carte de tâche colorée selon la priorité
- Bouton "View in FoxWise ToDo"
- Footer professionnel

Consultez le fichier complet EMAIL_REMINDERS_SETUP.md pour plus de détails!
