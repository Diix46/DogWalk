# Guide de Deploiement - DogWalk

Deploiement sur Cloudflare Pages avec D1 (base de donnees SQLite edge).

> **Note**: NuxtHub Admin a ferme le 31 decembre 2025. Ce guide utilise Cloudflare directement.

## Prerequis

- Compte [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuit)
- Node.js 18+
- pnpm

## Etape 1: Creer la base de donnees D1

1. Va sur [Cloudflare Dashboard > D1](https://dash.cloudflare.com/?to=/:account/workers/d1)
2. Clique **Create database**
3. Nom: `dogwalk-db`
4. **Copie l'ID de la database** (tu en auras besoin)
c39c296b-4866-4c0f-a3e7-ff7fb545ef88

Ou via CLI:
```bash
npx wrangler d1 create dogwalk-db
```

Note l'ID retourne:
```
Created database 'dogwalk-db' with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Etape 2: Configurer le projet

### Option A: Via nuxt.config.ts (recommande)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... autres configs

  hub: {
    db: {
      dialect: 'sqlite',
      driver: 'd1',
      connection: {
        databaseId: 'c39c296b-4866-4c0f-a3e7-ff7fb545ef88'  // <-- Remplace par ton ID D1
      }
    }
  },
})
```

### Option B: Via wrangler.toml

Mets a jour `wrangler.toml`:
```toml
name = "dogwalk"
compatibility_date = "2024-11-01"
pages_build_output_dir = ".output/public"

[[d1_databases]]
binding = "DB"
database_name = "dogwalk-db"
database_id = "TON-DATABASE-ID-ICI"  # <-- Remplace par ton ID D1
migrations_dir = "server/db/migrations"
```

## Etape 3: Appliquer les migrations

```bash
# Appliquer les migrations sur la database de production
npx wrangler d1 migrations apply dogwalk-db --remote
```

## Etape 4: Deployer sur Cloudflare Pages

### Via Git (recommande - CI/CD automatique)

1. **Push ton code sur GitHub** (si pas deja fait):
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ton-user/dogwalk.git
git push -u origin main
```

2. **Connecter a Cloudflare Pages**:
   - Va sur [Cloudflare Dashboard > Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
   - Clique **Create** > **Pages** > **Connect to Git**
   - Selectionne ton repo GitHub
   - Configure le build:
     - **Build command**: `pnpm build`
     - **Build output directory**: `.output/public`
     - **Root directory**: `/` (ou le chemin si monorepo)

3. **Ajouter les bindings D1**:
   - Dans Pages > Settings > **Functions** > **D1 database bindings**
   - Variable name: `DB`
   - D1 database: `dogwalk-db`

4. **Ajouter les variables d'environnement**:
   - Dans Pages > Settings > **Environment variables**
   - Ajoute:

| Variable | Valeur |
|----------|--------|
| `NUXT_SESSION_SECRET` | `openssl rand -base64 32` |

5. **Deployer**: Chaque push sur `main` declenche un deploy automatique!

### Via CLI (deploy manuel)

```bash
# Build
pnpm build

# Deploy
npx wrangler pages deploy .output/public --project-name dogwalk
```

## Etape 5: Verifier

1. L'URL sera du type: `https://dogwalk.pages.dev`
2. Ouvre sur ton telephone pour tester le GPS!

## Generer le secret de session

```bash
# Mac/Linux
openssl rand -base64 32

# Resultat exemple: K7gNj2mP8xQr5tYw3vBn9cHf4jLs6kMd1pRu0oAe2iX=
```

## Commandes utiles

```bash
# Voir les databases D1
npx wrangler d1 list

# Executer du SQL en production
npx wrangler d1 execute dogwalk-db --remote --command "SELECT * FROM users LIMIT 5"

# Voir les migrations appliquees
npx wrangler d1 migrations list dogwalk-db --remote

# Appliquer les migrations
npx wrangler d1 migrations apply dogwalk-db --remote

# Logs en temps reel
npx wrangler pages deployment tail

# Build local
pnpm build

# Preview local (simule Cloudflare)
pnpm preview
```

## Troubleshooting

### "D1_ERROR: no such table"
Les migrations n'ont pas ete appliquees:
```bash
npx wrangler d1 migrations apply dogwalk-db --remote
```

### "Session error" ou auth qui marche pas
Verifie que `NUXT_SESSION_SECRET` est configure dans Cloudflare Pages > Settings > Environment variables.

### Migration echoue car table existe deja
```bash
# Marquer la migration comme appliquee sans l'executer
npx nuxt db mark-as-migrated 0003_yellow_ultimo
```

### Voir les erreurs de build
Dans Cloudflare Pages > Deployments > clique sur un deploy > View build logs

## Architecture

```
Local (pnpm dev)          Production (Cloudflare)
-----------------         ----------------------
SQLite local              D1 Database (edge)
.data/db/                 dogwalk-db
localhost:3000            dogwalk.pages.dev
```

## Checklist

- [ ] Database D1 creee sur Cloudflare
- [ ] ID de database configure (nuxt.config.ts ou wrangler.toml)
- [ ] Migrations appliquees (`wrangler d1 migrations apply`)
- [ ] `NUXT_SESSION_SECRET` configure sur Cloudflare Pages
- [ ] Build reussi (`pnpm build`)
- [ ] Binding D1 configure sur Cloudflare Pages

---

**Documentation officielle:**
- [NuxtHub Self-Hosting](https://hub.nuxt.com/docs/getting-started/deploy)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
