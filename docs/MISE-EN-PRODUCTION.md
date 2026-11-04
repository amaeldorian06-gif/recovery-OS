# Mise en production — état et reste à faire

> Dernière mise à jour : 3 novembre 2026. Ce document suit l'ordre d'exécution : ce qui est fait, ce qui bloque, ce qui reste.

## Étape 1 — Fiabilité technique (TERMINÉE)

| # | Livrable | Où | Vérification |
|---|---|---|---|
| 1 | Garde-fou d'interface : écran d'erreur explicatif au lieu d'une page blanche | `src/components/AppErrorBoundary.tsx`, branché dans `src/main.tsx` | `npm run smoke` — 13 contrôles de rendu |
| 2 | Saisie d'une clé de licence dans les paramètres (+ jours d'essai restants) | `src/components/LicenseCard.tsx`, utilisé par `AppWorkspace` | `src/storage/license.test.ts` (validation, plans, essai) |
| 3 | Rappel de sauvegarde sur le tableau de bord (> 7 jours ou jamais) | `src/utils/backupPolicy.ts` + `src/components/BackupReminder.tsx` | `src/utils/backupPolicy.test.ts` |
| 4 | Page 404 interne + 404 statique | `src/components/NotFoundPage.tsx`, `public/404.html`, `src/app/routes.ts` | `src/app/routes.test.ts` + smoke |

Corrections associées :

- **Le routage ne retombe plus silencieusement sur l'accueil.** Tout chemin inconnu renvoie `notfound` : avant, `/tarif` (faute de frappe) affichait la landing en 200, ce qui masquait les liens cassés et trompait le visiteur.
- **Date du dernier export persistée** : `SettingsRecord.lastBackupAt`, conservé par `repository.saveSettings` sans écraser les autres champs (test dédié).
- **Adresse de contact centralisée** dans `src/config/brand.ts` — un seul point à modifier.

### Preuves d'exécution

```bash
npm run typecheck   # 0 erreur
npm test            # 81 / 81 (59 avant cette étape)
npm run smoke       # 13 contrôles de rendu, 0 échec
npm run build       # 447 kB (gzip 127 kB), dist/404.html présent
```

### Limites assumées de cette étape

- Le **chemin de capture** de l'`ErrorBoundary` est vérifié au niveau du contrat React (`getDerivedStateFromError`) et de son écran, **pas** par une exception réelle dans un navigateur : aucun navigateur n'est disponible dans l'environnement d'édition.
- Les parcours réels sont désormais couverts par Playwright **en CI** (`npm run e2e`, job « Parcours navigateur »), et non plus seulement par rendu statique. L'environnement d'édition ne peut pas télécharger le navigateur (CDN bloqué) : l'exécution réelle a lieu dans GitHub Actions.
- `LicenseCard` et `BackupReminder` dépendent du contexte applicatif : leur **logique** est testée, leur **rendu** ne l'est pas hors navigateur.
- La page 404 statique suppose que Vercel sert `404.html` à la racine de `dist` pour un statut 404. **À confirmer après déploiement** (`curl -I https://<domaine>/page-inexistante` doit renvoyer `404`).

## Étape 2 — Juridique et commercial (RÉDIGÉ, à compléter par l'éditeur)

**Décisions du 3 novembre 2026** : facturation manuelle + clé générée par l'éditeur · **vente B2B exclusive**.
**Révision du 4 novembre 2026** : éditeur = **personne physique établie au Cameroun** ; la franchise française de TVA (art. 293 B du CGI) est **retirée** — elle ne s'applique pas à lui. La TVA relève de `tax.regime`.

| # | Livrable | État |
|---|---|---|
| 5 | Mentions légales (LCEN art. 1-1) | Rédigé — `/mentions-legales` |
| 6 | CGU (conditions d'utilisation du site et du logiciel) | Rédigé — `/cgu` |
| 7 | CGV (19 articles, B2B) | Rédigé — `/cgv` |
| 8 | Politique de confidentialité (RGPD art. 3-2 + loi camerounaise) | Rédigé — `/confidentialite` |
| 9 | Rétractation (B2B : aucune légale) + **garantie commerciale de 14 jours** | Rédigé — `/retractation` |
| 10 | Générateur de clés de vente | `npm run licence -- --plan pro` |

**Ce qui reste, et qui n'appartient qu'à vous :**

1. Renseigner `src/config/editor.ts` : nom légal, adresse, ville, téléphone, courriel, numéro de déclaration d'activité, identifiant fiscal (NIU). **Aucun SIREN, greffe ni capital social n'est demandé** : ils n'existent pas pour cet éditeur. `npm run legal:check` échoue tant que les 7 champs manquent.
2. Faire relire les textes par un juriste — de préférence connaissant le droit camerounais et l'OHADA — avant une vente significative.
3. Trancher le rôle contractuel de Maketou et de Chariow à partir de leurs conditions générales, puis mettre à jour `src/config/channels.ts`.
4. Désigner un représentant dans l'Union (RGPD art. 27) ou documenter l'exemption applicable.
5. Si la vente aux particuliers est décidée plus tard : médiateur de la consommation, `salesScope: 'b2c'`, double consentement L221-28 13° (France).

Voir `docs/CONFORMITE-LEGALE.md` : sources, pièges évités (art. 6-III abrogé, plateforme ODR fermée, bouton de rétractation obligatoire depuis le 19 juin 2026) et zones grises assumées.

## Étape 3 — Preuve avant annonce publique

| # | Tâche | Statut |
|---|---|---|
| 10 | Playwright : inscription → import CSV → sauvegarde → persistance | **Fait — 8 scénarios verts en CI** (`npm run e2e`) |
| 11 | Test manuel Chrome / Firefox / Safari + navigation privée | Non fait |
| 12 | Restauration d'une sauvegarde **volontairement corrompue** via l'UI | Non fait (couvert au niveau unitaire) |
| 13 | Benchmark 10 000+ factures | Non fait |

## Rappel des invariants à ne pas casser

1. **Aucune donnée financière sur un serveur.** Vercel ne sert que des fichiers statiques.
2. **La licence est une activation locale de confort**, jamais présentée comme inviolable.
3. **La CRF est une heuristique interne**, jamais présentée comme IFRS 9 / CECL.
4. **Aucune opération destructrice sans confirmation explicite** (`RESTAURER`).
5. **Une sauvegarde n'est jamais écrasée sans prévisualisation.**
