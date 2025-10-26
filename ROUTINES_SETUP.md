# Configuration de la fonctionnalité Routines

## Création de la table dans Supabase

Pour activer la fonctionnalité Routines, vous devez créer la table `routines` dans votre base de données Supabase.

### Étapes:

1. Connectez-vous à votre projet Supabase: https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Copiez et collez le contenu du fichier `scripts/create-routines-table.sql`
4. Cliquez sur **Run** pour exécuter le script

### Vérification

Une fois la table créée, vous pouvez vérifier qu'elle existe en allant dans **Table Editor** et en cherchant la table `routines`.

## Fonctionnalités

- **Créer des routines récurrentes** : Définissez des activités qui se répètent quotidiennement, hebdomadairement ou mensuellement
- **Catégories** : Organisez vos routines par catégories (Famille, Détente, Travail, Sport, Bien-être)
- **Intégration automatique** : Les routines apparaissent automatiquement dans le Day Planner aux dates appropriées
- **Prise en compte par l'IA** : L'assistant AI du Day Planner tient compte de vos routines lors de la planification

## Utilisation

1. Allez dans la section **Routines** du menu
2. Cliquez sur **Nouvelle Routine**
3. Remplissez les informations:
   - Titre (ex: "Aller chercher les enfants")
   - Description (optionnel)
   - Catégorie
   - Heure et durée
   - Fréquence (quotidien, hebdomadaire ou mensuel)
   - Options de récurrence selon la fréquence choisie
4. Sauvegardez

Les routines apparaîtront automatiquement dans votre Day Planner pour chaque jour applicable!
