# Configuration de la Clé OpenAI

## Problème Actuel

Votre clé OpenAI actuelle semble être expirée ou invalide. Les fonctionnalités suivantes ne fonctionnent pas:
- 🎤 **Speech-to-Text** (transcription vocale avec Whisper)
- 🔊 **Text-to-Speech** (voix de l'agent)
- 💬 **Chat AI** (agent conversationnel Foxy)

## Solution: Obtenir une Nouvelle Clé OpenAI

### Étape 1: Créer un compte OpenAI (si nécessaire)
1. Allez sur https://platform.openai.com/signup
2. Créez un compte ou connectez-vous

### Étape 2: Obtenir votre clé API
1. Allez sur https://platform.openai.com/api-keys
2. Cliquez sur "Create new secret key"
3. Donnez-lui un nom (ex: "FoxWise ToDo App")
4. **IMPORTANT**: Copiez la clé immédiatement - vous ne pourrez plus la voir après!

### Étape 3: Configurer le Crédit
1. Allez sur https://platform.openai.com/account/billing/overview
2. Ajoutez une méthode de paiement
3. OpenAI offre souvent des crédits gratuits pour les nouveaux comptes ($5-$18)
4. Pour une utilisation normale de FoxWise, quelques dollars par mois suffisent

### Étape 4: Remplacer la Clé dans votre Application
1. Ouvrez le fichier `.env.local` à la racine du projet
2. Trouvez la ligne `OPENAI_API_KEY=...`
3. Remplacez l'ancienne clé par votre nouvelle clé:
   ```
   OPENAI_API_KEY=sk-proj-VOTRE_NOUVELLE_CLE_ICI
   ```
4. Sauvegardez le fichier

### Étape 5: Redémarrer l'Application
```bash
# Arrêtez le serveur (Ctrl+C dans le terminal)
# Puis redémarrez:
npm run dev
```

## Vérification

Une fois redémarré, testez:
1. ✅ Ouvrez le chat AI (bouton Foxy)
2. ✅ Essayez d'envoyer un message
3. ✅ Testez le bouton microphone pour la transcription vocale

Si tout fonctionne, vous verrez des réponses de Foxy et pourrez utiliser la voix!

## Alternative: Utiliser Uniquement Google Gemini

Si vous ne voulez pas utiliser OpenAI, vous pouvez modifier l'application pour utiliser uniquement Google Gemini (qui est déjà configuré). Cependant, cela nécessite quelques modifications de code car:
- Gemini ne supporte pas nativement le Speech-to-Text comme Whisper
- Gemini n'a pas de Text-to-Speech comme OpenAI

**Votre clé Gemini actuelle fonctionne** (utilisée pour le parsing de tâches et la planification).

## Coûts Estimés

Avec une utilisation normale de FoxWise ToDo:
- **Speech-to-Text (Whisper)**: ~$0.006 par minute d'audio (~$0.36 pour 60 minutes)
- **Text-to-Speech**: ~$0.015 par 1000 caractères (~$0.30 pour 20 000 caractères)
- **Chat (GPT-4o-mini)**: ~$0.15 par million de tokens d'entrée (~$0.60 par million de tokens de sortie)

**Estimation mensuelle pour usage modéré**: $2-5 USD/mois

## Besoin d'Aide?

Si vous avez des problèmes:
1. Vérifiez que la clé commence par `sk-proj-` ou `sk-`
2. Vérifiez qu'il n'y a pas d'espaces avant/après la clé
3. Vérifiez que vous avez redémarré le serveur après la modification
4. Consultez les logs dans la console du navigateur (F12) pour voir les erreurs exactes
