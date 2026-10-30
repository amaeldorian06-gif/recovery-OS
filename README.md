# Revenue Recovery OS

Poste de pilotage du recouvrement d'impayés pour PME, cabinets et directions financières — **100 % local** : vos données financières vivent dans IndexedDB de votre navigateur et ne quittent jamais votre ordinateur.

- **Langue** : français (marché francophone UE)
- **Offres** : Essentiel 19 €/mois · Pro 49 €/mois · Cabinet 89 €/mois (essai 14 jours)
- **Hébergement** : statique (Vercel) — aucune donnée financière ne transite par le serveur

## Architecture

```
src/
├── app/AppContext.tsx        Contexte applicatif : seule passerelle UI ↔ Repository
│                             (mode réel IndexedDB / mode démo mémoire éphémère)
├── components/               Interface
│   ├── LandingPage / FeaturesPage / PricingPage   Site public (cosmic glassmorphism)
│   ├── SignInPage / SignUpPage                    Authentification locale (PBKDF2)
│   ├── AppWorkspace                                Application privée sobre (7 sections)
│   ├── PrioritizationTable, MetricsHeader          Tableau de bord
│   ├── CsvImportView, AgingReportView              Import & balance âgée
│   ├── PaymentModal, PromiseModal, ActionCenterModal
│   ├── ActionsJournalView, OverdueCalculatorView
│   └── BackupView                                  Sauvegarde / restauration
├── storage/                  Moteur de persistance (aucun composant n'ouvre IndexedDB)
│   ├── types.ts              Schéma v1 (SCHEMA_VERSION), stores IDB
│   ├── backend.ts            StorageBackend + MemoryBackend (tests / démo)
│   ├── idb.ts                Unique module IndexedDB
│   ├── repository.ts         Entrée métier unique : transactions, migrations, validation
│   ├── backup.ts             Export/restore JSON, empreinte SHA-256, confirmation RESTAURER
│   ├── license.ts            Clés RRV-…, vérification locale, plans < 100 €/mois
│   └── seed.ts               Données de démonstration éphémères
├── utils/                    Logique pure testée
│   ├── dates.ts              Dates locales (pas de dérive UTC), JJ/MM/AAAA
│   ├── money.ts              Montants EU/US (« 1 234,56 »), ambiguïtés explicites
│   ├── financial.ts          Aging, scoring 0–100, courbe CRF (heuristique), métriques
│   ├── csv.ts                RFC 4180, mapping FR/EN, doublons, export FR
│   └── calculator.ts         Coût du retard (portage, inflation, probabilité)
└── server/                   HÉRITAGE — non déployé (voir « Limites »)
```

### Schéma IndexedDB v1 — `revenue-recovery-os-v1`

| Store | Clé | Contenu |
|---|---|---|
| `meta` | `key` | Token de session active (jamais dans localStorage) |
| `organizations` | `id` | Organisations locales |
| `users` | `id` | PBKDF2-SHA256 (120k itérations, Web Crypto) |
| `sessions` | `token` | Sessions 7 jours, une active par utilisateur |
| `invoices` | `id` (index `organizationId`) | Factures + champs dérivés recalculés à la lecture |
| `payments` | `id` | Journal d'encaissements immuable ; `invoice.paidAmount` dérivé |
| `promises` | `id` | Engagements (ouvert / tenu / rompu ; rompus auto à la lecture) |
| `disputes` | `id` | Litiges |
| `actions` | `id` | Actions de recouvrement |
| `history` | `id` | Journal append-only |
| `settings` | `organizationId` | Préférences (devise, CA 90 jours…) |

## Démarrage

```bash
npm install --legacy-peer-deps          # nécessite --legacy-peer-deps (conflit esbuild/vite connu)
npm run dev                             # serveur de développement
npm test                                # 59 tests unitaires (node:test + tsx)
npm run typecheck                       # tsc --noEmit
npm run build                           # build statique → dist/
```

> **Attention** : `npm install` échoue sans `--legacy-peer-deps` (conflit `esbuild ^0.25` vs peer `vite@8`). Voir la section Limites.

## Procédure de sauvegarde

1. Dans l'application : **Sauvegarde → Exporter** — télécharge un JSON `recovery-os-backup-*.json` contenant l'intégralité de l'espace (factures, encaissements, engagements, litiges, actions, historique, paramètres) avec empreinte SHA-256.
2. Conservez ce fichier **hors de l'ordinateur de production** (clé USB, coffre, stockage chiffré).
3. Fréquence recommandée : avant chaque import CSV volumineux, puis hebdomadaire.

### Procédure de restauration

1. **Sauvegarde → Restaurer** → sélectionnez le fichier JSON.
2. L'aperçu affiche le contenu et vérifie l'empreinte **avant** toute écriture.
3. Choisissez **fusion** (ajout) ou **remplacement**.
4. Le remplacement exige la saisie exacte de `RESTAURER` — aucune restauration destructrice n'est possible sans cette confirmation explicite.

## Procédure de déploiement (Vercel)

```bash
npm run typecheck && npm test && npm run build   # 1. vérifications
npx vercel --prod                                 # 2. déploiement (ou import Git)
```

- `vercel.json` assure la réécriture SPA (toutes les routes → `index.html`), les en-têtes de sécurité et le cache immutable des assets.
- HTTPS est fourni par Vercel par défaut.
- Après déploiement, remplacez `https://recovery-os.vercel.app` par votre domaine réel dans `index.html`, `public/robots.txt` et `public/sitemap.xml`.
- **Aucune variable d'environnement, aucune base de données, aucun serveur Node** n'est requis en production.

### Tests multi-navigateurs (manuel)

Le stockage utilise IndexedDB + Web Crypto — testez : Chrome, Firefox, Safari (macOS), Edge. Le mode privé peut limiter la persistance (l'application affiche alors une alerte).

## Limites techniques connues

1. **Protection de licence locale** : la clé `RRV-…` est vérifiée hors ligne dans le navigateur. C'est une protection **honnête et dissuasive**, pas un contrôle serveur inviolable — présenté comme tel dans l'UI et la documentation.
2. **Courbe CRF** : heuristique interne de recouvrement (0,99 → 0,245 par tranche). **Ce n'est pas** une provision IFRS 9 / CECL et aucune conformité réglementaire n'est revendiquée.
3. **Serveur legacy non déployé** : `server.ts` + `src/server/` (Express) survivent comme documentation historique. Ils contiennent une vérification de mot de passe défaillante (prouvée par tests curl pendant l'audit) et sont **exclus du chemin de déploiement**. Ne pas les activer sans réécriture complète de l'authentification.
4. **Conflit npm** : `esbuild ^0.25` (devDep racine) entre en conflit avec le peer `esbuild ^0.27||^0.28` de `vite@8`. Utiliser `--legacy-peer-deps` (ou unifier les versions) jusqu'à résolution.
5. **Pas de synchronisation** : conception sans cloud. Une perte de l'ordinateur sans sauvegarde = perte des données. La procédure de sauvegarde ci-dessus est donc structurante.
6. **Tests navigateur non automatisés** : la suite couvre la logique pure (59 tests). L'UI n'a pas de tests E2E (Playwright/Cypress) à ce stade.

## Licence

Apache-2.0 (voir en-têtes de fichiers).
