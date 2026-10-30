# PHASE 1 — AUDIT AVANT MIGRATION LOCAL-FIRST

Date : 2026-10-30 · Branche : `arena/caf905e7-recovery-os`
Méthode : lecture intégrale des 43 fichiers source, exécution réelle (`npm install`, `tsc --noEmit`, 23 tests, `vite build`, serveur dev + sondes HTTP curl), exécution isolée des fonctions de parsing (montants EU/US, en-têtes FR, formats de dates), inspection du bundle produit.

---

## 1. DÉPENDANCES À `dbStore` (couche à remplacer)

`src/server/export.ts` n'existe pas ; le store mémoire est `src/server/store.ts` (classe `MultiTenantStore`, export `dbStore`).

| Fichier | Lignes | Usage |
|---|---|---|
| `src/App.tsx` | 8, 34, 132, 165, 195-196, 207, 220-221, 229, 232, 251-252, 260, 263, 284, 292 | état initial, chargement tenant, saveInvoices, updateInvoice, recordOnboardingStep |
| `src/components/SignInPage.tsx` | 18, 52, 66 | `authenticateUser`, `createSession` (appels **navigateur**) |
| `src/components/SignUpPage.tsx` | 18, 85 | `registerUserAndTenant` (appel **navigateur**) |
| `src/components/AppWorkspace.tsx` | 3 | `SEED_USERS` (switcher de tenant) |
| `src/components/Navbar.tsx` | 12 | type `User` |
| `src/components/AuthModal.tsx` | 2 | `SEED_USERS` (impersonation) |
| `src/components/WelcomePage.tsx` | 19 | types (composant **jamais importé**) |
| `src/server/routes.ts` | 2 | endpoints REST (jamais appelés par le UI) |
| `src/server/security.test.ts` | 3 | tests du store mémoire |

**Constat central (vérifié) :** le store est importé par le bundle client et s'exécute en mémoire navigateur. Aucun `fetch` n'existe dans `src/`. L'API Express existe et fonctionne (sondée par curl) mais **n'est jamais appelée**. Conséquence : **toute donnée saisie disparaît au rechargement**.

## 2. APPELS À L'API EXISTANTE

Aucun. `grep -rn "fetch(" src/` → 0. Le bundle produit ne contient que le `fetch` de préchargement Vite. Les 8 endpoints `/api/*` (`src/server/routes.ts`) sont donc de la façade morte côté produit.

Anomalie critique relevée pendant la sonde : **`POST /api/auth/login` ne vérifie jamais le mot de passe** (tout mot de passe non vide renvoie un token valide). Vérifié par curl.

## 3. CARTE DES DONNÉES

| Entité | Support actuel | Persistance |
|---|---|---|
| `InvoiceRecord` | `Map<orgId, InvoiceRecord[]>` dans `MultiTenantStore` | ❌ mémoire |
| `User` + `passwordHash` | `User[]` (hash réversible `hash_${password}_secure`) | ❌ mémoire |
| `Session` | `Map<token, Session>` (7 jours) | ❌ mémoire |
| `OnboardingState` | `Map<orgId, OnboardingState>` | ❌ mémoire |
| `ActionLog` | `useState` React dans `App.tsx` | ❌ **jamais rendu nulle part** |
| Encaissements | champ `paidAmount` écrasé sur la facture | ❌ aucun journal de paiement |
| Promesses | champ `promisedPaymentDate` (une seule) | ❌ aucune historique |
| Litiges | champ `status: 'disputed'` + `disputeReason` | ❌ aucun historique |
| Historique / audit | `lastActionDate`/`lastActionType` (types seuls) | ❌ jamais renseignés |
| Paramètres | — | ❌ inexistants |
| Version du schéma | — | ❌ inexistante |
| Analytics | `Map` 100 évènements (`analytics.ts`) | ❌ jamais lu |

## 4. FONCTIONNALITÉS SIMULÉES (vérifiées)

| Revendication | Fichier | Réalité |
|---|---|---|
| « Isolation complète des données inter-entreprises » | `SignInPage.tsx` | magasin mémoire unique dans le bundle client |
| « Live SaaS Workspace · Tenant Encrypted » | `Navbar.tsx` | badge décoratif |
| « Chiffrement TLS 1.3 / AES-256 au repos » | `SignUpPage.tsx` | aucune donnée stockée |
| « Calcul des intérêts de retard (BCE + 10%) » | `SignInPage.tsx` | aucun calcul d'intérêts n'existe |
| « Audit-grade immutable activity ledger » | `PricingPage.tsx` | `actionLogs` en mémoire, jamais rendu |
| « SOC 2 Type II », « SSO/SAML », « APIs SAP/NetSuite » | `PricingPage.tsx` | aucun code |
| Capacité IA Gemini | `metadata.json` | `@google/genai` dans `package.json`, 0 import |
| Authentification (UI) | `SignInPage` | boutons de connexion rapide 1 clic ; `App.tsx:31` démarre **déjà connecté** en Sarah Chen |
| Authentification (API) | `routes.ts` | mot de passe non vérifié |

## 5. RISQUES DE PERTE DE DONNÉES

| # | Risque | Fichier | Sévérité |
|---|---|---|---|
| D1 | Aucune persistance : rechargement = perte totale | `store.ts` | 🔴 Critique |
| D2 | Import CSV **remplace** tout le portefeuille (`saveInvoices` = `Map.set`) | `store.ts:283`, `App.tsx:195` | 🔴 Critique |
| D3 | Montants EU corrompus : `1.234,56 → 1.23456`, `1234,56 → 123456` (erreur ×1000) | `CsvImportView.tsx:120` | 🔴 Critique |
| D4 | Dates non-ISO → `NaN` → **0 jour de retard silencieux** (facture affichée « Current ») | `financial.ts:9` | 🔴 Critique |
| D5 | Date de référence figée `2026-10-29` (16 occurrences) : aging et score **ne vieillissent plus** | `financial.ts:10` + 7 fichiers | 🔴 Critique |
| D6 | `daysPastDue`, `agingBucket`, `riskScore` calculés **une seule fois à l'import**, jamais recalculés (paiement non compris) | `CsvImportView.tsx`, `App.tsx` | 🟠 Élevé |
| D7 | `PromiseModal` **écrase** les notes d'origine de la facture | `App.tsx:247` | 🟡 Moyen |
| D8 | En-têtes FR non détectés (`Facture #`, `Échéance`, `Solde payé`) → import refusé ou faux | `csv.ts:68-115` | 🟠 Élevé |
| D9 | `npm start` (prod) plante : `ERR_MODULE_NOT_FOUND` | `package.json` | 🟠 Élevé |
| D10 | `npm install` échoue (conflit peer esbuild/vite8) · aucun lockfile | `package.json` | 🟠 Élevé |

## 6. PLAN DE MIGRATION VERS LOCAL-FIRST (IndexedDB)

### 6.1 Principe
Plus aucune écriture dans `dbStore`. Nouvelle couche `src/storage/` :
`Repository` (seule porte d'entrée métier) → `StorageBackend` (interface) → `IndexedDBBackend` (prod) / `MemoryBackend` (tests + démo éphémère).
Aucun composant ne touche IndexedDB directement (règle vérifiable par revue + test d'interface).

### 6.2 Schéma IndexedDB v1 (base `revenue-recovery-os-v1`)

| Store | Clé | Index | Contenu |
|---|---|---|---|
| `meta` | clé | — | `schemaVersion`, `activeSessionId`, `license` |
| `organizations` | `id` | — | nom, devise par défaut, dates |
| `users` | `id` | `email` | profil + hash PBKDF2-SHA256 salé (Web Crypto) |
| `sessions` | `token` | `userId`, `active` | expiration 7 j |
| `invoices` | `id` | `orgId`, `orgId+dueDate` | brute : montants, dates, statut, litige, promise liée |
| `payments` | `id` | `orgId`, `invoiceId` | **nouveau** : journal d'encaissements immuable |
| `promises` | `id` | `orgId`, `invoiceId` | **nouveau** : historique des promesses (statuts) |
| `disputes` | `id` | `orgId`, `invoiceId` | **nouveau** : motifs et résolutions |
| `actions` | `id` | `orgId`, `invoiceId` | **nouveau** : actions de recouvrement + relances programmées |
| `history` | `id` | `orgId`, `entityId` | **nouveau** : journal d'audit append-only |

`paidAmount` dérivé = somme des `payments` (source de vérité = le journal, plus l'écrasement).

### 6.3 Séquence de migration

| Étape | Action | Fichiers | Détruit ? |
|---|---|---|---|
| M1 | Modules `core` purs : dates FR/ISO, montants EU/US, aging, scoring, CRF, métriques | `utils/dates.ts`, `utils/money.ts`, `utils/financial.ts` | non (évolution en place) |
| M2 | Moteur CSV : mapping FR/EN, validation explicite, modes import fusion/remplacement | `utils/csv.ts`, `CsvImportView.tsx` | non |
| M3 | Stockage : backend + repository + migrations + historique + intégrité | `src/storage/*` (nouveau) | non |
| M4 | Sauvegarde : export JSON, inspection d'intégrité, prévisualisation, restauration | `src/storage/backup.ts` | non |
| M5 | Réécriture de `App.tsx` sur `Repository` + routeur de chemins + mode démo éphémère | `App.tsx`, `main.tsx` | remplace l'import `dbStore` |
| M6 | Pages d'auth locales (création de compte, session, mot de passe) | `SignInPage`, `SignUpPage` | non (composants conservés, réécrits) |
| M7 | Espace privé sobre FR + sauvegarde/restauration + licence locale | `AppWorkspace`, vues | non |
| M8 | Public FR cosmique, tarifs < 100 €/mois, SEO, `vercel.json` | `LandingPage`, `FeaturesPage`, `PricingPage`, `index.html` | non |

### 6.4 Justifications de non-suppression
- `src/server/store.ts` et `src/server/routes.ts` sont **conservés** dans le dépôt mais **retirés du chemin d'exécution** : l'API serveur contredit les décisions verrouillées (hbergement statique Vercel, persistance navigateur exclusive) et présente une faille d'authentification (mot de passe non vérifié). Ils sont marqués obsolètes et non déployés.
- `PublicMarketingView.tsx`, `WelcomePage.tsx`, `AuthModal.tsx` (inatteignable) : conservés pendant cette phase, listés pour suppression justifiée à l'étape suivante (≈ 1 115 lignes mortes).
- Démonstration : **mémoire uniquement** (`MemoryBackend`), jamais persistée → la démo ne peut plus altérer les données réelles, par construction.

### 6.5 Validation obligatoire par étape
`tsc --noEmit` · suite de tests `node --test` · `vite build` · revue des fichiers modifiés. Aucun test déclaré réussi sans exécution réelle rapportée.
