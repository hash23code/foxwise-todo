# Configuration de la Météo - Day Planner

## ⚠️ PROBLÈME FRÉQUENT: Mauvaise Météo Affichée

**Symptôme**: L'app affiche "pluie" mais il neige chez vous, ou la météo ne correspond pas du tout.

**Cause**: L'app utilise **Montréal par défaut** si la géolocalisation n'est pas activée!

**Solution Rapide**:
1. Cliquez sur l'icône 📍 en haut à droite du widget météo
2. Autorisez la géolocalisation dans votre navigateur
3. La météo sera maintenant VOTRE vraie météo locale! ❄️

---

## 🌤️ Vue d'ensemble

Le Day Planner intègre maintenant la météo pour planifier intelligemment tes tâches. L'IA considère la météo pour:
- Planifier les tâches extérieures durant les bonnes périodes
- Privilégier les tâches intérieures par mauvais temps
- Exception: les tâches URGENTES sont toujours planifiées

## 🚀 Configuration Rapide

### Option 1: Utiliser sans API Key (Recommandé pour débuter)
L'app fonctionne sans configuration! Elle utilisera des données météo mockées pour le développement.

### Option 2: Activer la vraie météo (Gratuit)

1. **Créer un compte OpenWeatherMap**
   - Va sur https://openweathermap.org/api
   - Clique sur "Sign Up" (gratuit)
   - Confirme ton email

2. **Obtenir ta clé API**
   - Connecte-toi à ton compte
   - Va dans "API keys"
   - Copie ta clé API (commence par un code alphanumérique)
   - **Free tier:** 1,000 appels/jour (largement suffisant)

3. **Ajouter la clé dans .env.local**
   ```env
   # OpenWeather API Key (optionnel)
   OPENWEATHER_API_KEY=ta_cle_api_ici
   ```

4. **Redémarrer le serveur**
   ```bash
   # Arrête le serveur (Ctrl+C)
   npm run dev
   ```

C'est tout! La vraie météo est maintenant active! 🎉

---

## 🌍 Géolocalisation Automatique

### Utiliser ta position actuelle (📍 ESSENTIEL!)

Le widget météo dispose maintenant d'un **bouton de géolocalisation** automatique ET d'un **indicateur de localisation**!

**Comment l'utiliser:**
1. Dans le Day Planner, regarde le widget météo
2. **En haut du widget**, tu verras la localisation actuelle (ex: "Montreal" ou "Votre Ville")
3. Clique sur l'icône **📍** (MapPin) à droite du widget
4. Le navigateur te demandera la permission d'accéder à ta position
5. Accepte → La météo s'affichera pour ta position actuelle!

**Nouveau: Indicateur de Localisation**
En haut du widget météo, tu verras maintenant:
```
📍 Montreal          Défaut
```
ou
```
📍 Votre Ville       GPS
```

- **"Défaut"** = Montréal utilisé (pas ta vraie météo!) ⚠️
- **"GPS"** = Ta position réelle utilisée (météo locale précise!) ✅

**Caractéristiques:**
- ✅ Détection automatique de ta position GPS
- ✅ Se souvient de ton choix (localStorage)
- ✅ Mise à jour automatique quand tu changes de date
- ✅ Clique à nouveau pour désactiver et revenir à Montréal
- ✅ **NOUVEAU**: Affichage du nom de la ville détectée

**Icône bleue = Géolocalisation active** 🔵
**Icône grise = Position par défaut (Montréal)** ⚫

---

## 📍 Changer la Position par Défaut

Par défaut (si géolocalisation désactivée), la météo est pour **Montréal (45.5017, -73.5673)**.

### Modifier la position par défaut

Si tu veux changer la ville par défaut, modifie `app/api/weather/route.ts` ligne 7-8:

```typescript
const lat = searchParams.get('lat') || '45.5017'; // Ta latitude
const lon = searchParams.get('lon') || '-73.5673'; // Ta longitude
```

**Exemples de coordonnées:**
- **Paris:** `48.8566, 2.3522`
- **New York:** `40.7128, -74.0060`
- **Londres:** `51.5074, -0.1278`
- **Tokyo:** `35.6762, 139.6503`

**Trouver tes coordonnées:**
- Google Maps: Clic droit → "Plus d'infos sur cet endroit"
- https://www.latlong.net/

---

## 📊 Fonctionnalités Météo

### Widget Météo
- **Température:** Min/Max du jour
- **Périodes:** Matin (6h-12h), Après-midi (12h-18h), Soir (18h-23h)
- **Indicateurs:** Vert = bon pour extérieur, Orange = privilégier intérieur
- **Précipitations & Vent:** Affichés pour chaque période

### IA Météo-Consciente

L'IA utilise la météo pour:

✅ **Bonnes conditions (Vert):**
- Ciel dégagé
- Nuages légers
- Température normale (>-10°C, <35°C)
- Pluie <30%

❌ **Mauvaises conditions (Orange/Rouge):**
- Pluie >60%
- Neige
- Orages
- Températures extrêmes (<-10°C ou >35°C)

### Règles de Planification

1. **Tâches Extérieures:**
   - Planifiées UNIQUEMENT durant les bonnes périodes météo
   - Exception: Si URGENT, planifiées quand même

2. **Tâches Intérieures:**
   - Privilégiées durant mauvais temps
   - Peuvent être planifiées n'importe quand

3. **Priorités:**
   - **URGENT:** Ignorent la météo (doivent être faites)
   - **HIGH/MEDIUM/LOW:** Suivent la météo

4. **Groupement:**
   - Tâches extérieures groupées durant fenêtres de beau temps
   - Maximise l'efficacité

---

## 🧪 Tester la Météo

### Test Rapide

1. **Lance l'app:**
   ```bash
   npm run dev
   ```

2. **Va sur Day Planner:**
   - Tu devrais voir le widget météo sous la date
   - 3 cartes: Matin, Après-midi, Soir

3. **Change de date:**
   - Utilise les flèches ← →
   - La météo se met à jour automatiquement

4. **Teste l'IA:**
   - Clique "AI Assistant"
   - Ajoute des tâches avec tags "extérieur" ou "outdoor" dans le titre
   - Génère un plan
   - L'IA devrait planifier les tâches extérieures durant les bonnes périodes

### Exemple de Tâches pour Tester

```
Tâches extérieures:
- "Tondre le gazon" (outdoor)
- "Laver la voiture" (outdoor)
- "Aller courir" (outdoor)

Tâches intérieures:
- "Réviser code" (indoor)
- "Écrire documentation" (indoor)
- "Meeting équipe" (indoor)
```

### Vérifier que la Météo Est Correcte

**Ouvre la console (F12) et cherche:**
```
🌤️ [Weather API] Request: {
  date: "2025-11-30",
  location: { lat: "45.52", lon: "-73.57" },
  hasCustomLocation: true    // ← Doit être TRUE pour GPS!
}

🌤️ [Weather API] Real weather data received: {
  location: "Votre Ville",    // ← Doit être VOTRE ville, pas Montreal!
  current: {
    temp: -5,
    main: "Snow",             // ← Doit correspondre à la vraie météo
    description: "neige modérée"
  }
}
```

Si tu vois:
- `hasCustomLocation: false` → La géolocalisation n'est PAS activée
- `location: "Montreal"` → Tu vois la météo de Montréal, pas la tienne!

---

## 🐛 Dépannage

### La météo ne s'affiche pas

**Vérifications:**
1. Le serveur dev est lancé? (`npm run dev`)
2. Pas d'erreurs dans la console?
3. Le widget affiche "Chargement météo..."? (Normal pendant 1-2 secondes)

**Si ça ne fonctionne pas:**
- Ouvre la console du navigateur (F12)
- Va dans l'onglet Network
- Cherche l'appel à `/api/weather`
- Vérifie s'il y a des erreurs

### L'API key ne fonctionne pas

**Erreurs possibles:**
- `401 Unauthorized`: Clé API invalide ou non activée
  - Attends 10 minutes après création (activation)
  - Vérifie que tu as copié toute la clé
- `429 Too Many Requests`: Limite atteinte (1000/jour en free tier)
  - Attends demain ou upgrade ton plan

**Solution temporaire:**
- Retire `OPENWEATHER_API_KEY` du `.env.local`
- L'app utilisera les données mockées

### L'IA ne considère pas la météo

**Vérifications:**
1. Le widget météo s'affiche?
2. Tu as créé des tâches avec mots-clés "outdoor", "extérieur", etc.?
3. La météo montre au moins une période en orange/rouge?

**Debug:**
- Ouvre la console durant la génération du plan
- Cherche `weatherData` dans les logs

---

## 📚 API OpenWeatherMap

### Limites Free Tier
- **1,000 appels/jour**
- **Actualisations:** Toutes les 10 minutes
- **Historique:** Non inclus
- **Précision:** Bonne (±2°C)

### Cache Intégré
L'API est mise en cache **1 heure**:
- Réduit les appels API
- Améliore la performance
- Économise ta limite quotidienne

### Upgrade (Si besoin)

Si tu dépasses 1,000 appels/jour:
- **Startup Plan:** $40/mois, 100,000 appels/jour
- **Developer Plan:** $120/mois, 1,000,000 appels/jour

(Probablement pas nécessaire pour une app perso)

---

## 🎨 Personnalisation

### Modifier les seuils de météo

Édite `app/api/weather/route.ts` dans la fonction `getSuitabilityInfo()`:

```typescript
// Seuil de pluie (actuellement 60%)
if (precipitation > 60) {
  suitable = false;
}

// Températures extrêmes (actuellement -10°C et 35°C)
if (temp < -10) {
  suitable = false;
} else if (temp > 35) {
  suitable = false;
}
```

### Modifier les périodes horaires

Actuellement:
- Matin: 6h-12h
- Après-midi: 12h-18h
- Soir: 18h-23h

Pour changer, édite ligne 60-80 de `app/api/weather/route.ts`.

---

## ✨ Fonctionnalités Futures

Idées pour améliorer:
- [ ] Support de la géolocalisation automatique
- [ ] Alertes météo push
- [ ] Suggestions de report de tâches si mauvais temps
- [ ] Météo sur plusieurs jours pour planification semaine
- [ ] Graphiques de tendances météo

---

## 🙋 Besoin d'aide?

**Documentation OpenWeather:**
- https://openweathermap.org/api/one-call-3
- https://openweathermap.org/faq

**Problèmes avec l'app:**
- Vérifie les logs de la console
- Teste avec les données mockées
- Vérifie que toutes les variables d'environnement sont définies

**Bon planning! 🚀**
