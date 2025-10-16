# FoxWise ToDo - Guide de Configuration

## Vue d'ensemble

FoxWise ToDo fait partie de la suite FoxWise et partage la même base de données et authentification que FoxWise Finance. Cela permet une expérience utilisateur unifiée avec un seul compte.

## Architecture de Sécurité

### Authentification
- **Clerk** gère toute l'authentification des utilisateurs
- Un compte Clerk unique pour toutes les apps FoxWise
- Les routes API vérifient l'authentification avant toute opération

### Base de données
- **Supabase** héberge toutes les données
- Les routes API utilisent le **Service Role Key** qui bypass RLS
- RLS est activé avec des politiques restrictives comme couche de sécurité supplémentaire
- Tous les accès passent par les routes API authentifiées

## Ce qui a été configuré

### ✅ Fichiers créés/modifiés :
1. **lib/supabase.ts** - Client Supabase avec Service Role Key
2. **supabase_schema.sql** - Schéma de base de données avec RLS sécurisé
3. **app/layout.tsx** - Titre mis à jour pour "FoxWise ToDo"
4. **.env.local** - Variables d'environnement (déjà configurées)

### ✅ Sécurité configurée :
- Service Role Key utilisé dans les API routes
- RLS activé avec politiques restrictives
- Authentification Clerk sur toutes les routes
- Filtrage par user_id dans toutes les requêtes

## Ce que VOUS devez faire

### 1. Créer les tables dans Supabase

Vous devez exécuter le fichier `supabase_schema.sql` dans votre projet Supabase existant :

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet (le même que FoxWise Finance)
3. Cliquez sur **SQL Editor** dans le menu latéral
4. Cliquez sur **New Query**
5. Copiez-collez tout le contenu de `supabase_schema.sql`
6. Cliquez sur **Run** (ou F5)

**Important :** Ce script créera les tables ToDo dans votre base existante, à côté des tables Finance. Elles ne se chevauchent pas.

### 2. Vérifier les variables d'environnement

Votre fichier `.env.local` existe déjà et contient :
- ✅ Clés Clerk (partagées avec Finance)
- ✅ URL et clés Supabase (partagées avec Finance)
- ✅ Clé Gemini AI (optionnelle)

**Si vous avez déjà configuré FoxWise Finance, vous n'avez RIEN à faire ici.**

### 3. Lancer l'application

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### 4. Tester l'authentification

1. Ouvrez `http://localhost:3000`
2. Connectez-vous avec le même compte que FoxWise Finance
3. Vous devriez voir le dashboard ToDo

## Tables créées

Le schéma crée ces tables dans Supabase :

- **todo_lists** - Catégories de tâches (Maison, Travail, etc.)
- **tasks** - Tâches individuelles
- **task_reminders** - Rappels pour les tâches
- **calendar_notes** - Notes du calendrier
- **task_attachments** - Pièces jointes (fonctionnalité future)
- **task_comments** - Commentaires (fonctionnalité future)
- **user_settings** - Préférences utilisateur

Toutes les tables ont un champ `user_id` qui lie les données à l'utilisateur Clerk.

## Vérification de la sécurité

### ✅ Checklist de sécurité :

1. **Service Role Key sécurisée ?**
   - ✅ Utilisée uniquement côté serveur (API routes)
   - ✅ Jamais exposée au client
   - ✅ Dans .env.local (pas dans git)

2. **RLS configuré ?**
   - ✅ RLS activé sur toutes les tables
   - ✅ Politiques restrictives (bloquent l'accès direct)
   - ✅ Couche de sécurité supplémentaire

3. **Authentification vérifiée ?**
   - ✅ Toutes les routes API vérifient Clerk auth
   - ✅ Filtrage par user_id dans toutes les requêtes
   - ✅ Erreur 401 si non authentifié

## Structure de la base de données partagée

```
SUPABASE (Projet unique)
├── Tables FoxWise Finance
│   ├── wallets
│   ├── transactions
│   ├── budgets
│   ├── investments
│   └── ...
│
├── Tables FoxWise ToDo
│   ├── todo_lists
│   ├── tasks
│   ├── task_reminders
│   └── ...
│
└── Tables Communes
    └── user_settings (peut être partagé ou séparé)
```

## Dépannage

### Erreur "Missing Supabase environment variables"
- Vérifiez que `.env.local` contient toutes les variables
- Redémarrez le serveur dev après modification du .env

### Erreur 401 Unauthorized
- Vérifiez que les clés Clerk sont correctes
- Assurez-vous d'être connecté
- Vérifiez que Clerk est bien configuré

### Erreur de base de données
- Vérifiez que le schéma SQL a été exécuté
- Vérifiez que les tables existent dans Supabase
- Vérifiez le Service Role Key

## Prochaines étapes

1. **Exécuter le schéma SQL dans Supabase**
2. **Lancer l'app avec `npm run dev`**
3. **Tester la connexion et création de tâches**

Une fois que tout fonctionne, vous aurez :
- ✅ Authentification unique (SSO) entre Finance et ToDo
- ✅ Base de données partagée et sécurisée
- ✅ Architecture scalable pour futures apps FoxWise

## Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez les logs du terminal
3. Vérifiez que toutes les étapes ci-dessus ont été suivies

---

**Créé pour FoxWise Suite** - Applications de productivité et finance personnelle
