# Conformité légale — état, sources et reste à faire

> révision du 3 novembre 2026. À lire avant toute mise en vente.

## 1. Ce qui a été livré

| Document | Route | Base légale | Longueur |
|---|---|---|---|
| Mentions légales | `/mentions-legales` | LCEN, art. **1-1** | 8 sections |
| Conditions générales de vente | `/cgv` | C. conso. L111-1, L221-5, L221-18, L221-28 ; C. com. L441-1, L441-10, D441-5 | 18 articles |
| Politique de confidentialité | `/confidentialite` | RGPD, art. 6, 13, 15-20 | 12 sections |
| Rétractation et garantie commerciale | `/retractation` | C. conso. L221-18 (écarté en B2B) + garantie volontaire | 6 sections + bouton |

Le contenu est isolé dans `src/content/legal.ts` (testable), l'identité dans `src/config/editor.ts` (source unique), la présentation dans `src/components/LegalDocumentPage.tsx`.

## 2. Quatre pièges évités — et pourquoi la plupart des modèles en ligne sont faux

### 2.1 L'article 6-III de la LCEN n'existe plus

C'est la référence que citent encore la quasi-totalité des modèles et générateurs. La **loi SREN n° 2024-449 du 21 mai 2024** (en vigueur depuis le 23 mai 2024) a :
- déplacé l'obligation d'identification de l'éditeur de l'article 6-III vers l'**article 1-1** ;
- déplacé la sanction pénale de l'article 6-VI vers l'**article 1-2** ;
- réservé l'article 6 aux seuls services intermédiaires (hébergeurs, plateformes).

Aucune mention de l'article 6-III n'apparaît dans nos pages, sauf pour signaler son obsolescence — un test le vérifie phrase par phrase.

### 2.2 La plateforme RLL/ODR est fermée

Le règlement (UE) 2024/3228 a fermé définitivement la plateforme européenne de règlement en ligne des litiges le **20 juillet 2025**. Les CGV qui conservent un lien vers `ec.europa.eu/consumers/odr` pointent vers une page morte. Ce lien est explicitement proscrit par un test.

### 2.3 Le bouton de rétractation est obligatoire depuis le 19 juin 2026

**Ordonnance n° 2026-2 et décret n° 2026-3 du 5 janvier 2026**, modifiant l'article L221-21 du Code de la consommation : tout professionnel concluant des contrats **à distance, via une interface en ligne, avec un consommateur** doit fournir une fonctionnalité de rétractation gratuite, identifiable par les mots « renoncer au contrat ici », accessible pendant les 14 jours. Sanction : 15 000 € (personne physique) à 75 000 € (personne morale), art. L242-13.

### 2.4 L'exception « contenu numérique » n'est jamais automatique

Article L221-28, 13° : la rétractation ne disparaît que si le consommateur a **à la fois** accepté l'exécution immédiate **et** renoncé expressément à son droit. Une clause générale « pas de rétractation sur les services numériques » serait abusive. Le texte distingue explicitement les deux consentements.

## 3. Trois décisions prises (3 novembre 2026)

### 3.1 Clientèle : **B2B exclusif**

Décision : le service est vendu aux seuls professionnels. Conséquences appliquées dans les textes :

| Obligation | Statut en B2B exclusif | Traitement |
|---|---|---|
| Information précontractuelle consommateur (L111-1) | Hors champ | CGV art. 1 : service réservé aux professionnels |
| Droit de rétractation (L221-18) | Hors champ | CGV art. 10 : aucun droit légal — **mais** une garantie commerciale d'annulation de 14 jours est offerte volontairement |
| Bouton de rétractation en ligne (L221-21, obligatoire depuis le 19/06/2026) | Hors champ | Conservé, reformulé en « Demander l'annulation » : il sert la garantie commerciale, pas une obligation légale |
| Médiation de la consommation (L616-1) | Hors champ | Aucun médiateur requis ni désigné ; les CGV l'expliquent au lieu de le taire |
| Garantie légale de conformité numérique (L224-25-12) | Hors champ | CGV art. 11 : garanties du Code civil (délivrance conforme 1604, vices cachés 1641) |

**Si l'éditeur vend un jour à un particulier**, il devra : adhérer à un médiateur agréé CECMC, recueillir le double consentement de l'article L221-28 13°, et rétablir le libellé réglementaire « renoncer au contrat ici ». Le code est déjà structuré pour : `salesScope` dans `src/config/editor.ts` et branches conditionnelles dans `src/content/legal.ts`.

### 3.2 TVA : **franchise en base**

`vatExempt: true`. Les CGV portent la mention obligatoire « TVA non applicable, article 293 B du Code général des impôts » et les prix affichés sont les prix effectivement dus (aucune taxe ajoutée). Aucun numéro de TVA n'est réclamé par `legal:check`.

### 3.3 Hébergement : numéro de téléphone

La LCEN impose de publier le **nom, l'adresse et le numéro de téléphone** de l'hébergeur. Vercel ne publie qu'un seul numéro de son fait : celui de sa page DMCA officielle (`vercel.com/legal/dmca-policy`).

Choix retenu : afficher `+1 559 288 7060` **en le qualifiant** — « ligne de signalement DMCA/abus publiée par l'hébergeur » — et ajouter `dmca@vercel.com` comme contact écrit vérifiable. Les numéros trouvés sur des annuaires tiers ((951) 383-6898, (415) 398-5463) n'ont pas été retenus : non vérifiables à la source.

## 4. Ce qui reste à faire — et qui ne peut pas être fait sans vous

`npm run legal:check` sort en **erreur** tant que ces champs sont vides :

```
✗ Raison sociale · Forme juridique · Capital social · SIREN/SIRET
  Ville du greffe · Adresse · Code postal · Ville · Téléphone
  Directeur de la publication · E-mail de contact
```

La TVA et le médiateur **ne sont plus réclamés** : la franchise en base dispense du numéro de TVA, et le B2B exclusif du médiateur.

À renseigner dans **`src/config/editor.ts`** uniquement.

### 4.1 Autres points à valider

| # | Point | Pourquoi |
|---|---|---|
| 1 | Adresse et téléphone de l'hébergeur | Adresse issue de la Privacy Notice Vercel ; numéro issu de `vercel.com/legal/dmca-policy`. Une vérification annuelle est conseillée : ces coordonnées peuvent changer. |
| 2 | Durée d'abonnement et reconduction | Les CGV indiquent « un mois ou un an, sans reconduction tacite ». À ajuster selon votre pratique commerciale réelle. |
| 3 | Plafond de responsabilité (12 mois de redevances) | Standard du secteur, mais à faire valider : une clause trop basse peut être jugée abusive face à un consommateur. |
| 4 | TVA | `vatExempt: true` (franchise en base). Si l'activité dépasse les seuils de franchise, passer à `false` et renseigner `vatNumber` : la mention 293 B disparaît automatiquement. |
| 5 | Registre des traitements (art. 30 RGPD) | Obligatoire dès lors que vous traitez des données, même peu. Non fourni ici : document interne, distinct des pages publiques. |
| 6 | Assurance responsabilité civile professionnelle | Fortement recommandée pour un éditeur de logiciel. |
| 7 | Contrat de sous-traitance avec Vercel (DPA) | À accepter dans votre espace Vercel pour couvrir l'hébergement. |

## 5. Réserves à assumer

**Ces textes ne constituent pas une consultation juridique.** Ils sont rédigés sur la base des textes en vigueur au 3 novembre 2026 et vérifiables (références citées), mais un avocat doit les relire avant toute mise en vente significative. Un document contractuel mal adapté à votre pratique réelle est plus dangereux qu'un document absent : il crée des obligations que vous n'appliquez pas.

**Points non couverts et assumés :**
- Pas de clause de réversibilité ni de sortie de contrat (sans objet : il n'y a pas de données hébergées chez l'éditeur).
- Pas de SLA chiffré (disponibilité, temps de rétablissement) : à ajouter si vous vendez à des cabinets.
- Pas de clause d'audit ni de sécurité renforcée.
- Le bouton de rétractation n'émet **pas** d'accusé de réception sur support durable : sans serveur, c'est l'e-mail envoyé par le client qui joue ce rôle. Cette limite est écrite sur la page.

## 6. Vérifications automatisées

`src/content/legal.test.ts` — 22 tests qui échouent si :
- l'article 6-III est présenté comme le fondement (au lieu de l'article 1-1) ;
- un lien vers la plateforme ODR réapparaît ;
- le périmètre B2B cesse d'être explicite, ou si un médiateur est réclamé à tort ;
- la mention de franchise de TVA (art. 293 B du CGI) disparaît ;
- les articles L221-18, L224-25-12, L441-1, L441-10, D441-5, L616-1 disparaissent ;
- les prix des CGV divergent des plans réels du produit (`PLAN_DETAILS`) ;
- une mention présente les indicateurs comme conformes IFRS 9 / CECL ;
- une clause de sauvegarde cesse d'affirmer que l'éditeur ne peut rien restaurer ;
- le texte contient un brouillon (`lorem`, `TODO`, crochet vide).

`scripts/smoke-render.tsx` — vérifie que les 4 pages se rendent réellement, sans `undefined` ni `NaN`, avec le bandeau de non-finalisation et le bouton de rétractation.
