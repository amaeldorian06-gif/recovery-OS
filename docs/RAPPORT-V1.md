# Rapport v1 — Revenue Recovery OS

**Date** : 30 octobre 2026 · **Branche** : `arena/caf905e7-recovery-os` · **Destinataire** : direction (utilisateur fondateur)

---

## 1. Architecture livrée

**Un site public statique + une application privée 100 % locale, sans aucun serveur de données financières.**

```
Utilisateur
   │
   ├─ Site public (Vercel, statique) ── Landing / Fonctionnalités / Tarifs / Connexion / Inscription
   │        └─ aucune donnée client n'y transite
   │
   └─ Application privée /app/* ── AppContext (seule passerelle UI)
            └─ Repository (seule entrée métier)
                 ├─ IndexedDBBackend → IndexedDB « revenue-recovery-os-v1 » (production)
                 └─ MemoryBackend → mémoire éphémère (tests + mode démonstration)
```

Points d'architecture verrouillés :

| Décision | Réalisation |
|---|---|
| Aucune donnée financière en cloud | IndexedDB uniquement ; aucune requête réseau sortante sur les données |
| Composants ne touchent jamais IndexedDB | Interdiction structurelle : seul `src/storage/idb.ts` ouvre la base |
| Transactions, migrations, validation | Repository versionné (`SCHEMA_VERSION = 1`), migrations par étapes |
| Licence séparée des données | Store IDB distinct ; activation présentée comme locale et contournable |
| Mode démo sans effet sur les données réelles | Backend mémoire physique, bannière, org `org-demo` |
| CRF sans revendication IFRS 9 | Courbe interne documentée comme heuristique dans le code **et** dans l'UI |
| Dates sans dérive UTC | Calcul en heure locale (`todayISO`, `daysPastDue`) |

## 2. Fichiers créés / modifiés (liste complète)

### Créés
| Fichier | Rôle |
|---|---|
| `docs/AUDIT-PHASE1.md` | Audit initial (19 constats, risques D1–D10, plan M1–M8) |
| `docs/RAPPORT-V1.md` | Ce rapport |
| `src/utils/dates.ts` (+ `.test.ts`) | Dates locales, JJ/MM/AAAA, erreurs explicites |
| `src/utils/money.ts` (+ `.test.ts`) | Montants EU/US, ambiguïté signalée, rejets explicites |
| `src/utils/financial.ts` (réécrit, tests réécrits) | Aging, scoring, CRF, métriques, validation |
| `src/utils/csv.ts` (réécrit) | RFC 4180, mapping FR/EN, doublons, export FR |
| `src/storage/{types,backend,idb,repository,backup,license,seed}.ts` | Moteur de persistance complet |
| `src/storage/{repository,backup}.test.ts` | Tests du moteur |
| `src/app/AppContext.tsx` | Contexte UI ↔ Repository, modes réel/démo |
| `src/components/ActionsJournalView.tsx` | Journal des relances (nouveau, comble un vide produit) |
| `src/components/BackupView.tsx` | Export / inspection / restauration |
| `vercel.json` | Réécriture SPA, en-têtes sécurité, cache assets |
| `package-lock.json` | Verrouillage des dépendances |
| `README.md` | Architecture, sauvegarde, déploiement, limites |

### Réécrits (FR, design verrouillé)
`App.tsx` (routeur de chemins), `Navbar.tsx`, `LandingPage.tsx` (cosmic glass), `FeaturesPage.tsx` / `PricingPage.tsx` (dark structuré), `SignInPage.tsx` / `SignUpPage.tsx`, `AppWorkspace.tsx` (sober, 7 sections), `MetricsHeader.tsx`, `PrioritizationTable.tsx`, `AgingReportView.tsx`, `CsvImportView.tsx`, `PaymentModal.tsx` (+ référence), `PromiseModal.tsx`, `ActionCenterModal.tsx`, `OverdueCalculatorView.tsx`, `index.html` (SEO fr-FR), `public/robots.txt`, `public/sitemap.xml`, `package.json` (scripts), `vite.config.ts` (preview host).

### Supprimés (avec justification)
| Fichier | Lignes | Justification |
|---|---|---|
| `WelcomePage.tsx` | 287 | Remplacé par Landing + portes d'entrée auth ; plus aucune référence (grep vérifié) |
| `PublicMarketingView.tsx` | 583 | Remplacé par Landing/Features/Pricing en français ; unique consommateur d'`analytics` |
| `AuthModal.tsx` | 245 | Remplacé par SignIn/SignUp plein écran avec repository |
| `AgingTemplateResourceView.tsx` | 207 | Page ressource EN ; le template CSV vit maintenant dans `CsvImportView` (FR) |
| `src/utils/analytics.ts` | — | Seul consommateur supprimé ; produit orienté confidentialité, pas de télémétrie par défaut |
| `src/utils/actionTemplates.ts` | — | Aucun consommateur (grep vérifié) ; modèles EN, remplacés par le formulaire FR structuré d'`ActionCenterModal` |

### Conservé comme héritage non déployé (non supprimé, justifié)
`server.ts`, `src/server/routes.ts`, `src/server/store.ts`, `src/server/security.test.ts`, `src/data/sampleReceivables.ts` — le serveur Express contredit le verrou « navigateur uniquement » et son `store.ts` présente une vérification de mot de passe défaillante (prouvée par tests curl en phase d'immersion). Il est **exclu du chemin de déploiement** (build = `vite build` seul), documenté comme historique, et ne doit pas être activé sans réécriture de l'auth.

## 3. Tests exécutés et résultats

| Commande | Résultat |
|---|---|
| `./node_modules/.bin/tsc --noEmit` | **0 erreur** |
| `npm test` | **59 / 59 tests verts, 0 échec** (dates, money, financial, calculator, seo, repository, backup) |
| `npm run build` | **Succès** — `dist/` 408 kB JS gzip 116 kB + 54 kB CSS (inférieur au build d'origine 456 kB) |
| `vite preview` + curl | Routes `/`, `/tarifs`, `/fonctionnalites`, `/app/dashboard`, `/connexion` → **200** avec coquille FR |

Couverture notable des tests : non-dérive UTC des dates, corruption de montant EU (D1, régression), modes d'import, paiements partiels, integrity backup (SHA-256 + détection de corruption), confirmation `RESTAURER`, scoring (concentration, promesses rompues), courbe CRF.

**Aucun test n'est déclaré vert sans exécution réelle.**

## 4. Limites techniques (honnêtes)

1. **Licence locale, pas un verrou serveur.** Une clé `RRV-…` vérifiée hors ligne peut être outrepassée par un utilisateur technique. C'est un modèle de confiance dissuasif — présenté ainsi sur la page Tarifs et dans les Paramètres.
2. **CRF = heuristique interne.** Courbe de recouvrement par tranche (0,99 → 0,245). Ni IFRS 9, ni CECL, ni provision comptable. Aucune validation méthodologique indépendante n'a été menée.
3. **Pas de synchronisation.** Décision produit : perte de l'appareil sans sauvegarde = perte des données. La procédure de sauvegarde est donc structurante, pas optionnelle.
4. **Conflit npm connu.** `npm install` échoue sans `--legacy-peer-deps` (esbuild 0.25 racine vs peer vite 8). Contournement documenté ; unifier les versions reste à faire.
5. **Pas de tests E2E navigateur.** La logique métier est testée (59 tests) ; l'UI n'a pas de Playwright/Cypress. Les tests multi-navigateurs (Chrome/Firefox/Safari/Edge, mode privé) restent manuels.
6. **Héritage serveur.** `server.ts` + `src/server/*` restent dans le dépôt pour documentation historique ; non déployés, non activables en l'état.
7. **Nom de domaine à substituer.** `recovery-os.vercel.app` est un placeholder dans `index.html` / `robots.txt` / `sitemap.xml` — à remplacer par le domaine réel au déploiement.

## 5. Procédure de sauvegarde

1. **Application → Sauvegarde → Exporter** : JSON complet (factures, encaissements, engagements, litiges, actions, historique, paramètres) avec empreinte SHA-256.
2. Copier le fichier **hors de l'appareil** (support amovible chiffré, coffre).
3. Fréquence : avant chaque import CSV volumineux + hebdomadaire.
4. **Restauration** : sélection du fichier → aperçu + vérification d'empreinte → choix fusion/remplacement → saisie `RESTAURER` obligatoire pour le remplacement. Aucune écriture avant confirmation.

## 6. Procédure de déploiement

```bash
npm install --legacy-peer-deps
npm run typecheck && npm test && npm run build
npx vercel --prod        # ou import Git → Vercel build automatique
```

- `vercel.json` : réécriture SPA (fallback `index.html` hors assets), en-têtes sécurité (nosniff, DENY frame, referrer, permissions), cache immutable `/assets/*`.
- HTTPS natif Vercel. Aucune variable d'environnement, aucune base, aucun serveur Node.
- Post-déploiement : remplacer le domaine placeholder (3 fichiers), tester l'inscription et l'export/restauration sur le domaine réel.

## 7. Points restant à valider (non vérifiés ici)

| Point | Pourquoi non validé |
|---|---|
| Inscription / connexion réelles **dans un navigateur** | La logique est testée côté repository ; le parcours complet UI n'a pas été rejoué dans un navigateur de cet environnement |
| Mode privé / navigation incognito (persistance IDB) | Nécessite un navigateur hôte ; l'alerte d'indisponibilité est codée mais non observée en conditions réelles |
| Safari / Firefox | Environnement de travail Linux uniquement |
| Restauration d'un backup réel corrompu via l'UI | Testée unitairement (checksum) ; le chemin UI complet n'a pas été exercé avec un fichier corrompu réel |
| Performance sur 10 000+ factures | Non benchmarké ; l'import CSV par lots n'a pas de test de charge |
| e-mailing réel des relances | Par conception : le produit journalise les actions, il n'envoie rien (pas de serveur mail) |
| Paiement / facturation des licences | Aucun prestataire de paiement n'est intégré — l'activation est locale, la vente reste manuelle |
| Accessibilité (contrastes, clavier, lecteur d'écran) | Non audité outre les bonnes pratiques Tailwind appliquées |

---

**Synthèse** : les sept phases du directive sont livrées. Le cœur financier et le moteur de stockage sont validés par 59 tests verts et un typecheck strict ; l'UI publique et privée est en français, séparée, sobre côté données ; le déploiement Vercel est prêt hors domaine réel ; les limites sont documentées sans enjolivement — en particulier le caractère non inviolable de la licence et le statut heuristique du CRF.
