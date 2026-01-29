# Design: Routes Dynamiques, Météo Améliorée & Articles

**Date**: 2025-01-29
**Statut**: Validé

---

## 1. Routes Dynamiques via Overpass/OSM

### Problème
Les parcours sont actuellement seedés manuellement en DB (15 routes à Toulouse). Pas de découverte dynamique selon la ville de l'utilisateur.

### Solution
Interroger l'API Overpass (OpenStreetMap) pour découvrir parcs, sentiers, chemins piétons à proximité de l'utilisateur, puis assembler des boucles de promenade.

### Flux
1. `GET /api/routes/discover?lat=...&lng=...&radius=5000` — Nouvel endpoint
2. Vérifier le cache DB : des routes OSM existent déjà dans cette zone ?
3. Si non → requête Overpass API (parcs, chemins piétons, berges, forêts)
4. Algorithme de construction de boucles : combiner les chemins trouvés en circuits de 15/30/45/60+ min (vitesse de marche ~4.5 km/h)
5. Sauvegarder en DB avec `source: 'osm'`
6. Retourner les routes avec `distance_from_user`

### Schema DB — Modifications
Ajouter à la table `routes` :
- `source` : text, enum('curated' | 'osm'), default 'curated'
- `osm_area_hash` : text, nullable — hash de la zone géographique pour cache
- `generated_at` : text, nullable — timestamp de génération

### Logique de cache
- Routes avec reviews → permanentes
- Routes OSM sans activité → nettoyées après 30 jours
- Cache géographique : zone de ~1km² arrondie

### Overpass Query (exemple)
```
[out:json][timeout:25];
(
  way["leisure"="park"](around:{radius},{lat},{lng});
  way["highway"="footway"](around:{radius},{lat},{lng});
  way["highway"="path"](around:{radius},{lat},{lng});
  way["waterway"](around:{radius},{lat},{lng});
  relation["leisure"="park"](around:{radius},{lat},{lng});
);
out body;
>;
out skel qt;
```

### Algorithme de construction de boucle
1. Récupérer les ways (chemins) de la réponse Overpass
2. Extraire les coordonnées de chaque way
3. Regrouper les ways proches pour former des boucles
4. Calculer la distance totale de chaque boucle
5. Estimer la durée (distance / 4.5 km/h)
6. Classer par durée (15, 30, 45, 60+ min)
7. Déterminer le type (urban/nature/mixed) selon les tags OSM
8. Générer le GeoJSON LineString pour chaque parcours

### Impact sur l'Explore Page
- Remplacer l'appel `/api/routes` par `/api/routes/discover` quand la géolocalisation est disponible
- Fallback sur `/api/routes` (routes curated) si pas de géolocalisation
- Les filtres durée/type restent identiques

---

## 2. Préparation de Balade — Itinéraire & Météo

### Problème
L'utilisateur ne voit pas l'itinéraire avant de partir et n'est pas averti des risques météo pendant la durée prévue de la balade.

### Solution

#### 2a. Itinéraire visible avant départ (`/routes/[id]`)
- Afficher le tracé GeoJSON complet sur la carte MapLibre
- Marqueurs départ (vert) et arrivée (rouge)
- Zoom automatique ajusté au tracé (fitBounds)
- Élévation et points d'intérêt si disponibles

#### 2b. Prévision météo sur la durée (`/routes/[id]`)
- Calculer la fenêtre temporelle : maintenant → maintenant + durée de la balade
- Utiliser `/api/weather/forecast` existant (6h de prévision)
- Afficher timeline visuelle : icônes météo par créneau de 15 min
- Système d'alerte à 3 niveaux :
  - **Vert** : Beau temps / nuageux → "Conditions favorables"
  - **Orange** : Vent fort / brouillard → "Conditions moyennes"
  - **Rouge** : Pluie / orage / neige → "Risque d'averse dans 30 min"
- L'alerte ne bloque pas le départ, elle informe

#### 2c. Alertes météo pendant la balade (`/walks/[id]`)
- Polling `/api/weather` toutes les 15 minutes pendant la balade active
- Comparaison avec la condition précédente
- Si dégradation détectée (ex: cloudy → rainy) :
  - Toast notification immédiate
  - Bandeau d'alerte persistant en haut de l'écran
- Conditions déclenchant une alerte : rainy, stormy, snowy

### Nouveaux composants
- `WeatherTimeline.vue` — Timeline horizontale des prévisions sur la durée
- `WeatherAlert.vue` — Bandeau d'alerte conditionnel (vert/orange/rouge)

### Modifications composable `useWeather`
- Ajouter `startWeatherPolling(lat, lng, intervalMs)` pour le suivi pendant la balade
- Ajouter `stopWeatherPolling()`
- Ajouter `weatherChanged` ref boolean pour détecter les changements

---

## 3. Articles — Nuxt Content + Nuxt Studio

### Problème
Pas de section contenu/conseils pour les propriétaires de chiens.

### Solution
Utiliser `@nuxt/content` pour un blog simple avec catégories, éditable via Nuxt Studio.

### Setup technique
- Dépendance : `@nuxt/content`
- Dossier : `content/articles/`
- Fichiers : Markdown avec front-matter

### Front-matter des articles
```yaml
---
title: "Comment promener son chien sous la pluie"
description: "Conseils pour des balades agréables même par mauvais temps"
category: santé | nutrition | comportement | équipement | races
image: /images/articles/rain-walk.jpg
publishedAt: 2025-01-15
---
```

### Pages
- `/articles` — Liste avec filtres par catégorie, cards avec image/titre/description
- `/articles/[slug]` — Page de détail, rendu markdown, navigation prev/next

### Catégories
- Santé
- Nutrition
- Comportement
- Équipement
- Races

### Navigation
Ajouter "Articles" dans le menu principal, entre "Explorer" et "Premium".

### Nuxt Studio
Compatible nativement avec `@nuxt/content`. Les non-développeurs éditent via l'interface web, commit auto sur le repo Git.

---

## Ordre d'implémentation suggéré

### Epic 8 : Itinéraire & Météo améliorée
1. Story 8.1 — Carte itinéraire sur `/routes/[id]` (tracé GeoJSON visible)
2. Story 8.2 — Timeline météo sur la durée de balade
3. Story 8.3 — Alertes météo avant départ (badge vert/orange/rouge)
4. Story 8.4 — Polling météo pendant la balade + notifications

### Epic 9 : Routes dynamiques OSM
1. Story 9.1 — Migration DB (champs source, osm_area_hash, generated_at)
2. Story 9.2 — Service Overpass (requête + parsing des données OSM)
3. Story 9.3 — Algorithme de construction de boucles
4. Story 9.4 — Endpoint `/api/routes/discover` avec cache DB
5. Story 9.5 — Intégration Explore page (discover + fallback)
6. Story 9.6 — Nettoyage des routes OSM inactives (cron/scheduled)

### Epic 10 : Articles
1. Story 10.1 — Setup Nuxt Content + page liste `/articles`
2. Story 10.2 — Page détail `/articles/[slug]` + navigation
3. Story 10.3 — Articles exemples (3-5 articles de démo)
4. Story 10.4 — Intégration menu principal

---

## Fichiers impactés

### Nouveaux
- `server/api/routes/discover.get.ts`
- `server/utils/overpass.ts`
- `server/utils/route-builder.ts`
- `app/components/WeatherTimeline.vue`
- `app/components/WeatherAlert.vue`
- `app/pages/articles/index.vue`
- `app/pages/articles/[slug].vue`
- `content/articles/*.md`

### Modifiés
- `server/db/schema.ts` — Champs source, osm_area_hash, generated_at
- `app/pages/routes/[id].vue` — Carte itinéraire + timeline météo
- `app/pages/walks/[id].vue` — Polling météo + alertes
- `app/pages/explore.vue` — Appel discover endpoint
- `app/composables/useWeather.ts` — Polling + change detection
- `app/layouts/default.vue` — Lien Articles dans navigation
- `nuxt.config.ts` — Module @nuxt/content
- `package.json` — Dépendance @nuxt/content
