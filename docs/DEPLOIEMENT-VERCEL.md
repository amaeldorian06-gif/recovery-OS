# Déploiement Vercel — diagnostic et procédure

> État au 31 octobre 2026. Ce document remplace la note « remplacer le domaine à la main » du README.

## 1. Pourquoi la page affichait « This page doesn't exist »

Le projet Vercel `revenue-recovery` **n'est pas relié à ce dépôt**. Preuves :

| Élément | Constat |
|---|---|
| Source du déploiement (capture Vercel) | branche `main`, commit `73cd3f1` |
| `origin/main` de `recovery-OS` | `0ed2048` — **`73cd3f1` n'existe pas ici** |
| Message de commit affiché | « …Monorepo: apps/web (Next 15) » |
| Dépôt réellement connecté | `amaeldorian06-gif/revenue-recovery` |
| Nature de ce dépôt | monorepo Next.js 15 (`apps/web`), Supabase, workspaces npm |
| Config Vercel de ce dépôt | aucun `vercel.json` |

Dans un monorepo Next, la sortie est `apps/web/.next` ; Vercel lancé depuis la racine cherche `.next` à la racine et ne trouve **aucune page** → 404 « This page doesn't exist », alors que le statut du build est « Ready ».

Deuxième problème : la branche de production `main` de `recovery-OS` est restée au commit `0ed2048` (**avant** la v1). Même en branchant le bon dépôt, `main` ne contiendrait pas le produit.

## 2. Correctifs appliqués au dépôt

| # | Problème | Correction |
|---|---|---|
| 1 | `npm install` échoue en ERESOLVE (`esbuild ^0.25` épinglé vs peer `^0.27 \|\| ^0.28` de Vite 8) | `esbuild` porté à `^0.28.0` — installation sans `--legacy-peer-deps` |
| 2 | `package-lock.json` non versionné → build non reproductible | lockfile commité ; `npm ci` fonctionne |
| 3 | Aucune version de Node imposée | `engines.node >= 20.19` + `.nvmrc` (22) |
| 4 | Réécriture SPA par *negative lookahead* `/((?!assets/...).*)` — syntaxe non garantie par le routeur Vercel | routes SPA explicites (`/apercu`, `/tarifs`, `/app/:path*`…) ; les chemins inconnus renvoient un vrai 404 |
| 5 | `X-Frame-Options: DENY` sur tout le site → **aperçu Vercel et Arena impossibles en iframe** | en-tête supprimé (site sans donnée serveur, risque de clickjacking minimal) |
| 6 | Domaine codé en dur (`recovery-os.vercel.app`) dans 3 fichiers + ancienne URL Google Cloud Run dans `seo.ts` | jeton `__SITE_URL__` injecté au build via `VITE_SITE_URL` ; `seo.ts` utilise `window.location.origin` |
| 7 | `og:locale` en `en_US` dans `seo.ts` (module inutilisé) | `fr_FR` + avertissement « module historique » |
| 8 | 3,4 Mo d'images AI Studio copiées dans chaque `dist/` (`public/artifacts`, `public/assets/aistudio`) | supprimées (zéro référence vérifiée par grep) |
| 9 | Nom de paquet `react-example` | `revenue-recovery-os` |
| 10 | Aucune CI | `.github/workflows/ci.yml` : `npm ci` + types + tests + build + contrôle du domaine injecté |

## 3. Procédure de déploiement (10 minutes)

### 3.1 Créer le bon projet Vercel

1. Vercel → **Add New… → Project**.
2. Importer **`amaeldorian06-gif/recovery-OS`** (et non `revenue-recovery`).
3. Réglages du projet :

| Réglage | Valeur |
|---|---|
| Framework Preset | **Vite** |
| Root Directory | **`.`** (racine, ne pas choisir un sous-dossier) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | **22.x** |

4. Variables d'environnement (Production **et** Preview) :

```
VITE_SITE_URL = https://<le-domaine-final>
```

Sans cette variable, le build utilise `https://recovery-os.vercel.app` comme valeur par défaut (canonical, `og:url`, `robots.txt`, `sitemap.xml`).

### 3.2 Brancher la branche de production

Le projet Vercel déploie `main`. Or `main` est encore à `0ed2048`.
Une **pull request** `arena/caf905e7-recovery-os → main` a été ouverte : la fusionner (fast-forward) met la v1 sur `main` et déclenche le déploiement de production.

### 3.3 Domaine

Le domaine `revenue-recovery-pi.vercel.app` appartient à l'ancien projet : le retirer de l'ancien projet **avant** de l'attacher au nouveau, sinon Vercel refuse (« domaine déjà utilisé »).

## 4. Vérifications après déploiement

```bash
BASE=https://<domaine>
for p in / /fonctionnalites /apercu /suivi /tarifs /connexion /inscription /app/dashboard; do
  printf "%-22s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")"
done
curl -sI "$BASE/" | grep -i "strict-transport\|x-frame\|content-type-options"
curl -s "$BASE/"      | grep -o '<link rel="canonical"[^>]*>'
curl -s "$BASE/robots.txt" | tail -1
curl -s "$BASE/sitemap.xml" | grep -c "<loc>"
```

Attendu : **200** sur les 8 routes, canonical sans `__SITE_URL__`, sitemap à 4 URL.

## 5. Retour arrière

Vercel → Deployments → déploiement précédent → **Instant Rollback**. Aucune donnée utilisateur n'est concernée : la persistance est locale au navigateur (IndexedDB), jamais sur Vercel.

## 6. Points non vérifiables depuis ce dépôt

- L'état exact des réglages du projet Vercel (Root Directory, branche de production) n'est pas lisible sans accès au compte Vercel : les étapes ci-dessus sont à appliquer manuellement.
- Les « 3 Recommandations » affichées par Vercel ne sont pas connues ici.
- Aucun test de déploiement réel n'a été exécuté dans cette session ; la validation s'arrête au build local et au rendu `vite preview`.
