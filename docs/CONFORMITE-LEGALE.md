# Conformité légale — état, sources et reste à faire

> Révision du 4 novembre 2026. À lire avant toute mise en vente.
>
> **Ces textes ne sont pas une consultation juridique et ne valent pas certification de conformité.**
> Ils sont exacts sur ce qu'ils affirment et silencieux sur ce qu'ils ne peuvent pas établir.

## 1. Qui est l'éditeur — et ce qu'il n'est pas

| Élément | Statut |
|---|---|
| Type | `individual` — personne physique |
| Pays d'établissement | Cameroun (droit OHADA) |
| Activité | exercée en nom personnel, sans société constituée |
| Nom commercial | Revenue Recovery OS (nom du produit, sans personnalité juridique) |
| Distribution | vente directe (facture + clé de licence) ; Maketou (principal) et Chariow (secondaire) |

Conséquences appliquées dans le code :

- **aucun SIREN, SIRET, RCS, greffe, capital social ni adresse française** n'est affiché, réclamé ou simulé ;
- Le service n'est **jamais** présenté comme une société : les mentions légales le disent explicitement ;
- les obligations françaises (LCEN, Code de la consommation, Code de commerce, CGI) ne sont **plus** présentées comme applicables : elles sont soit écartées, soit citées comme référence extérieure volontaire.

L'ex-version de ce dépôt (étape 2) affichait « TVA non applicable, article 293 B du CGI » et réclamait 11 champs français. C'était une fiction : elle a été supprimée.

## 2. Le modèle de données juridique

### 2.1 Quatre états par champ

| État | Sens | Effet sur la publication |
|---|---|---|
| `provided` | valeur renseignée et assumée | aucune |
| `not_applicable` | le champ n'a pas d'objet (capital d'une personne physique, code postal camerounais, greffe français) | **aucun blocage** |
| `to_complete` | valeur juridiquement nécessaire mais absente | **bloque** le document |
| `legal_review_required` | question ouverte nécessitant un professionnel du droit | **bloque** la revendication de conformité |

Règle absolue : **une donnée absente n'est jamais remplacée par une invention**. Le rendu affiche `[à compléter]` ou `[à vérifier juridiquement]`, y compris en production.

### 2.2 Trois états par document

| État | Signification |
|---|---|
| `incomplete` | au moins un champ obligatoire manque — le document n'est pas publiable |
| `legal_review_required` | les mentions sont renseignées, mais un point de droit reste à trancher |
| `complete` | aucun champ manquant **et** aucun point ouvert |

`complete` signifie « configuration cohérente », **pas** « conformité juridique ». Le code ne délivre jamais de certificat.

### 2.3 Localisation

- `src/config/editor.ts` — identité, types d'éditeur, validation conditionnelle, hébergeur.
- `src/config/jurisdictions.ts` — référentiels par pays (registres, identifiant fiscal, autorité de protection des données, code postal).
- `src/config/channels.ts` — canaux de distribution et rôle contractuel.
- `src/config/tax.ts` — traitement fiscal affiché au public.
- `src/content/legal.ts` — les cinq documents, construits depuis la configuration.
- `src/components/LegalConfigPanel.tsx` — console interne d'état (page `/suivi`).
- `src/config/editorBuilder.ts` — constructeur d'identité (logique pure) : à partir d'une saisie, produit la configuration typée, en respectant l'applicabilité par type et par pays.
- `src/components/LegalIdentityBuilder.tsx` — formulaire correspondant (page `/suivi`). Saisie en mémoire, aucun stockage, aucune transmission ; le bloc généré est vérifié par compilation avant d'être proposé.

## 3. Les cinq documents

| Document | Route | Fondement | Sections |
|---|---|---|---|
| Mentions légales | `/mentions-legales` | droit camerounais + OHADA ; LCEN art. 1-1 citée à titre volontaire | 10 |
| Conditions générales d'utilisation | `/cgu` | droit camerounais + OHADA | 12 |
| Conditions générales de vente | `/cgv` | droit camerounais + OHADA | 19 |
| Politique de confidentialité | `/confidentialite` | RGPD art. 3-2, 6, 13, 15-20, 27 ; loi camerounaise n° 2010/012 | 15 |
| Rétractation et garantie commerciale | `/retractation` | protection des consommateurs (écartée en B2B) + garantie volontaire | 6 |

Les cinq documents partagent la même source d'identité : un test vérifie qu'ils affichent le même nom et le même courriel.

## 4. Adaptations imposées par le statut réel

### 4.1 Pas de code postal

Le Cameroun n'attribue pas de code postal généralisé. Le champ est `not_applicable`, **ne bloque rien** et n'apparaît pas dans l'adresse affichée (ville + pays suffisent).

### 4.2 Statut de l'entrepreneur personne physique (OHADA)

Acte uniforme sur le droit commercial général, **article 30** : l'entreprenant est dispensé d'immatriculation au RCCM mais doit **déclarer son activité** ; le numéro de déclaration doit figurer sur les factures et documents professionnels, suivi de la mention **« Entreprenant dispensé d'immatriculation »**.

Le code prévoit cette mention (`individualRegistry.requiredMention`) mais ne l'affiche **que si un numéro de déclaration existe** : afficher la mention sans numéro reviendrait à revendiquer un statut non établi.

> ⚠️ Le statut exact (commerçant de plein droit, entreprenant déclaré, activité civile) dépend de l'activité réellement exercée. C'est un point de validation juridique, pas une déduction automatique.

### 4.3 Droit applicable et juridiction

Les CGV et les CGU désignent le **droit camerounais et les actes uniformes OHADA**, et les juridictions du lieu d'établissement de l'éditeur, sous réserve des dispositions impératives protégeant un consommateur.

Il n'est plus écrit que les conditions sont « soumises au droit français » : c'était faux.

### 4.4 Fiscalité

`tax.regime = 'no_french_vat'`. L'éditeur n'est pas établi en France, n'y facture aucune TVA et n'a pas de numéro de TVA intracommunautaire. Les prix sont hors taxes.

Pour une prestation B2B intracommunautaire, l'autoliquidation par le client (reverse charge) est en principe applicable — **à confirmer par un conseil fiscal**. La mention 293 B n'apparaît plus que si `regime = 'french_franchise'`, cas qui ne correspond pas à la configuration actuelle.

### 4.5 RGPD

Le site cible un public professionnel francophone, dont une partie se trouve dans l'Union : le critère de l'**article 3, paragraphe 2** est donc rempli pour ces personnes. La politique de confidentialité le motive au lieu de le supposer.

Conséquences non résolues à ce jour :
- **représentant dans l'Union (article 27)** : en principe obligatoire, sauf exemption à documenter ;
- **autorité de contrôle** : celle de l'État membre de résidence de la personne concernée. Au Cameroun, aucune autorité équivalente à la CNIL n'est identifiée — le texte le dit au lieu d'inventer un organisme.

### 4.6 Canaux de distribution

Maketou et Chariow sont enregistrés avec `role: 'unknown'` et `roleVerified: false`. Les documents indiquent que leur qualification — revendeur, mandataire, prestataire de paiement ou *merchant of record* — **n'est pas établie**, et qu'ils ne sont **ni éditeurs ni titulaires des droits**.

Cette qualification détermine pourtant qui est le vendeur contractuel, qui émet la facture et qui traite les remboursements. C'est le point juridique le plus structurant qui reste ouvert.

## 5. Ce qui reste à faire — et qui n'appartient qu'à vous

`npm run legal:check` sort en **erreur** tant que ces champs manquent :

```
✗ Nom légal de l'éditeur
✗ Adresse professionnelle
✗ Ville
✗ Adresse e-mail de contact
✗ Téléphone
✗ Numéro de déclaration d'activité (RCCM)
✗ Titulaire des droits (dérivé du nom légal)
```

**Non demandés, et c'est volontaire** : capital social, SIREN/SIRET, greffe, code postal, numéro de TVA français, médiateur de la consommation.

À renseigner dans **`src/config/editor.ts`** uniquement. La console `/suivi` affiche l'état champ par champ et permet de copier un bloc de configuration valide.

### 5.1 Points à validation juridique

| # | Point | Pourquoi |
|---|---|---|
| 1 | Rôle contractuel de Maketou et Chariow | détermine le vendeur, la facture, les remboursements |
| 2 | Statut de l'entrepreneur (OHADA art. 30) | conditionne la mention obligatoire sur les factures |
| 3 | Articulation droit camerounais / OHADA et dispositions impératives du pays du client | un client professionnel étranger reste protégé par certaines règles |
| 4 | TVA intracommunautaire B2B | autoliquidation à confirmer |
| 5 | Représentant RGPD art. 27 | obligatoire en principe, exemption à documenter |
| 6 | Autorité de contrôle compétente | aucune équivalence CNIL identifiée au Cameroun |
| 7 | Plafond de responsabilité (12 mois) | standard du secteur, à valider |
| 8 | Registre des traitements (art. 30 RGPD) | document interne, non fourni ici |
| 9 | Assurance responsabilité civile professionnelle | fortement recommandée |
| 10 | Contrat de sous-traitance Vercel (DPA) | à accepter dans l'espace Vercel |

## 6. Vérifications automatisées

`src/config/editorBuilder.test.ts` — 26 tests : applicabilité par type et par pays, champs sans objet non réclamés, format de courriel et de téléphone, emplacement de modèle non remplacé, effet de la saisie sur les cinq documents, **bloc copiable compilable**.

`src/config/editor.test.ts` — 20 tests :
- la configuration livrée est bien `individual` / Cameroun ;
- aucun champ SIREN, greffe, capital ou code postal n'est réclamé à tort ;
- `not_applicable` ne bloque jamais ; `to_complete` bloque ; `legal_review_required` n'est jamais déclaré conforme ;
- une société doit fournir son capital, une personne physique non ;
- le repli de courriel est un domaine réservé RFC 2606 (jamais routable).

`src/content/legal.test.ts` — 33 tests :
- les cinq documents existent, sans doublon de section ni texte de remplissage ;
- **aucun SIREN, SIRET, RCS, capital ou « 293 B »** n'est affirmé (les occurrences ne peuvent apparaître que dans une phrase de négation) ;
- le service n'est jamais présenté comme une société ;
- les prix des CGV correspondent à `PLAN_DETAILS` ;
- les indicateurs ne sont jamais conformes IFRS 9 / CECL ;
- le rôle des plateformes n'est pas inventé ;
- l'article 27 du RGPD est annoncé comme non résolu ;
- les cinq documents affichent la même identité ;
- un champ manquant produit `[à compléter]`, jamais une valeur plausible.

`scripts/smoke-render.tsx` — 51 contrôles : rendu réel des 5 documents, bandeau d'état correct, absence de `undefined`/`NaN`, console `/suivi` cohérente.

## 7. Réserves à assumer

- **Aucune relecture par un juriste n'a eu lieu.** Les références citées sont vérifiables, l'adaptation au statut de l'éditeur est réelle, mais un avocat doit relire avant une vente significative.
- **Les textes sont rédigés en français** et supposent un lecteur francophone ; ils ne sont pas traduits.
- **Pas de SLA chiffré**, pas de clause d'audit, pas de clause de réversibilité (sans objet : aucune donnée n'est hébergée chez l'éditeur).
- **Le bouton d'annulation n'émet pas d'accusé de réception** : sans serveur, l'e-mail envoyé par le client en tient lieu. Cette limite est écrite sur la page.
- **La conformité RGPD suppose une base légale par traitement** : elle est décrite, mais la tenue du registre et l'analyse d'impact éventuelle restent à produire.
