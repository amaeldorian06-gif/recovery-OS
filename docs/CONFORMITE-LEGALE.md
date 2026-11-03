# Conformité légale — état, sources et reste à faire

> révision du 3 novembre 2026. À lire avant toute mise en vente.

## 1. Ce qui a été livré

| Document | Route | Base légale | Longueur |
|---|---|---|---|
| Mentions légales | `/mentions-legales` | LCEN, art. **1-1** | 8 sections |
| Conditions générales de vente | `/cgv` | C. conso. L111-1, L221-5, L221-18, L221-28 ; C. com. L441-1, L441-10, D441-5 | 18 articles |
| Politique de confidentialité | `/confidentialite` | RGPD, art. 6, 13, 15-20 | 12 sections |
| Droit de rétractation | `/retractation` | C. conso. L221-18, L221-21, L221-28 13°, L616-1 | 6 sections + bouton |

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

## 3. Ce qui reste à faire — et qui ne peut pas être fait sans vous

`npm run legal:check` sort en **erreur** tant que ces champs sont vides :

```
✗ Raison sociale · Forme juridique · Capital social · SIREN/SIRET
  Ville du greffe · Numéro de TVA · Adresse · Code postal · Ville
  Téléphone · Directeur de la publication · E-mail de contact
  Médiateur de la consommation
```

À renseigner dans **`src/config/editor.ts`** uniquement.

### 3.1 Adhésion à un médiateur de la consommation — obligatoire en B2C

Article L616-1 du Code de la consommation : tout professionnel vendant à des **consommateurs** doit adhérer à un médiateur agréé CECMC et publier ses coordonnées (article R616-1), sous peine de 3 000 € (PP) / 15 000 € (PM).

Deux stratégies possibles :

| Stratégie | Conséquence |
|---|---|
| **Vente B2B exclusive** (recommandée au lancement) | Pas d'adhésion obligatoire. Les CGV excluent les consommateurs et le bouton de rétractation devient une simple bonne pratique. |
| **Vente B2C assumée** | Adhésion à un médiateur (quelques dizaines à quelques centaines d'euros par an) **avant** la première vente à un particulier. |

Tant qu'aucun médiateur n'est désigné, les CGV **l'écrivent noir sur blanc** plutôt que de laisser croire à un recours inexistant.

### 3.2 Autres points à valider

| # | Point | Pourquoi |
|---|---|---|
| 1 | Adresse et téléphone de l'hébergeur | L'adresse de Vercel provient de sa Privacy Notice ; le **numéro de téléphone** affiché est la ligne de signalement DMCA/abus et doit être revérifié sur `vercel.com/legal` avant publication. |
| 2 | Durée d'abonnement et reconduction | Les CGV indiquent « un mois ou un an, sans reconduction tacite ». À ajuster selon votre pratique commerciale réelle. |
| 3 | Plafond de responsabilité (12 mois de redevances) | Standard du secteur, mais à faire valider : une clause trop basse peut être jugée abusive face à un consommateur. |
| 4 | TVA | `vatExempt: false` suppose l'assujettissement. En franchise en base, passez à `true` : la mention « TVA non applicable, art. 293 B du CGI » sera reprise automatiquement. |
| 5 | Registre des traitements (art. 30 RGPD) | Obligatoire dès lors que vous traitez des données, même peu. Non fourni ici : document interne, distinct des pages publiques. |
| 6 | Assurance responsabilité civile professionnelle | Fortement recommandée pour un éditeur de logiciel. |
| 7 | Contrat de sous-traitance avec Vercel (DPA) | À accepter dans votre espace Vercel pour couvrir l'hébergement. |

## 4. Réserves à assumer

**Ces textes ne constituent pas une consultation juridique.** Ils sont rédigés sur la base des textes en vigueur au 3 novembre 2026 et vérifiables (références citées), mais un avocat doit les relire avant toute mise en vente significative. Un document contractuel mal adapté à votre pratique réelle est plus dangereux qu'un document absent : il crée des obligations que vous n'appliquez pas.

**Points non couverts et assumés :**
- Pas de clause de réversibilité ni de sortie de contrat (sans objet : il n'y a pas de données hébergées chez l'éditeur).
- Pas de SLA chiffré (disponibilité, temps de rétablissement) : à ajouter si vous vendez à des cabinets.
- Pas de clause d'audit ni de sécurité renforcée.
- Le bouton de rétractation n'émet **pas** d'accusé de réception sur support durable : sans serveur, c'est l'e-mail envoyé par le client qui joue ce rôle. Cette limite est écrite sur la page.

## 5. Vérifications automatisées

`src/content/legal.test.ts` — 17 tests qui échouent si :
- l'article 6-III est présenté comme le fondement (au lieu de l'article 1-1) ;
- un lien vers la plateforme ODR réapparaît ;
- les articles L221-18, L221-28 13°, L221-21, L224-25-12, L441-1, L441-10, D441-5, L616-1 disparaissent ;
- les prix des CGV divergent des plans réels du produit (`PLAN_DETAILS`) ;
- une mention présente les indicateurs comme conformes IFRS 9 / CECL ;
- une clause de sauvegarde cesse d'affirmer que l'éditeur ne peut rien restaurer ;
- le texte contient un brouillon (`lorem`, `TODO`, crochet vide).

`scripts/smoke-render.tsx` — vérifie que les 4 pages se rendent réellement, sans `undefined` ni `NaN`, avec le bandeau de non-finalisation et le bouton de rétractation.
