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

- Le **chemin de capture** de l'`ErrorBoundary` est vérifié au niveau du contrat React (`getDerivedStateFromError`) et de son écran, **pas** par une exception réelle dans un navigateur : aucun navigateur n'est disponible dans l'environnement de vérification.
- `LicenseCard` et `BackupReminder` dépendent du contexte applicatif : leur **logique** est testée, leur **rendu** ne l'est pas hors navigateur.
- La page 404 statique suppose que Vercel sert `404.html` à la racine de `dist` pour un statut 404. **À confirmer après déploiement** (`curl -I https://<domaine>/page-inexistante` doit renvoyer `404`).

## Étape 2 — Juridique et commercial (BLOQUANT pour vendre)

| # | Tâche | Bloquant | Qui |
|---|---|---|---|
| 5 | Remplacer `contact@recovery-os.example` par l'adresse réelle | Oui | Vous |
| 6 | Mentions légales : raison sociale, adresse, identifiant, contact | Oui (UE) | Vous (contenu) + moi (page) |
| 7 | CGV : prix, durée, résiliation, droit de rétractation 14 jours | Oui (UE) | Vous (contenu) + moi (page) |
| 8 | Politique de confidentialité : **aucune donnée financière transmise**, IndexedDB locale, Vercel = pages statiques uniquement | Oui (RGPD) | Moi |
| 9 | Canal de vente : facturation manuelle + envoi de clé, ou lien de paiement Stripe | Oui | Décision à prendre |

Aucun encaissement ne fonctionne aujourd'hui : la clé est générée à l'inscription avec le plan `trial` et le produit n'a aucun lien de commande.

## Étape 3 — Preuve avant annonce publique

| # | Tâche | Statut |
|---|---|---|
| 10 | Playwright : inscription → import CSV → paiement → sauvegarde → restauration | Non fait |
| 11 | Test manuel Chrome / Firefox / Safari + navigation privée | Non fait |
| 12 | Restauration d'une sauvegarde **volontairement corrompue** via l'UI | Non fait (couvert au niveau unitaire) |
| 13 | Benchmark 10 000+ factures | Non fait |

## Rappel des invariants à ne pas casser

1. **Aucune donnée financière sur un serveur.** Vercel ne sert que des fichiers statiques.
2. **La licence est une activation locale de confort**, jamais présentée comme inviolable.
3. **La CRF est une heuristique interne**, jamais présentée comme IFRS 9 / CECL.
4. **Aucune opération destructrice sans confirmation explicite** (`RESTAURER`).
5. **Une sauvegarde n'est jamais écrasée sans prévisualisation.**
