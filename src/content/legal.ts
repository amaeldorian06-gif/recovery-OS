import { EDITOR, HOST, PRODUCT, editorAddressLine } from '../config/editor';
import { PLAN_DETAILS } from '../storage/license';

/**
 * Contenu des documents légaux.
 *
 * Séparé de la présentation pour deux raisons :
 *  1. il est vérifiable par des tests (exactitude des références en vigueur) ;
 *  2. il ne dépend d'aucune bibliothèque d'interface.
 *
 * ⚠️ Ces textes sont un socle sérieux et à jour au 3 novembre 2026, PAS une
 * consultation juridique. Voir docs/CONFORMITE-LEGALE.md pour les points à
 * faire valider et les zones grises assumées.
 */

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  /** Renvoi interne vers un autre document. */
  link?: { label: string; path: string };
}

const priceList = (): string[] => [
  `Essai gratuit : 0 € pendant 14 jours, sans carte bancaire.`,
  `Essentiel : ${PLAN_DETAILS.essentiel.priceMonthly} € HT par mois et par organisation, ${PLAN_DETAILS.essentiel.seats} poste.`,
  `Professionnel : ${PLAN_DETAILS.pro.priceMonthly} € HT par mois et par organisation, ${PLAN_DETAILS.pro.seats} postes.`,
  `Cabinet : ${PLAN_DETAILS.cabinet.priceMonthly} € HT par mois et par organisation, ${PLAN_DETAILS.cabinet.seats} postes.`,
];

const vatSentence = (): string =>
  EDITOR.vatExempt
    ? 'TVA non applicable, article 293 B du Code général des impôts.'
    : 'Les prix sont indiqués hors taxes ; la TVA au taux en vigueur est ajoutée sur la facture. Les clients particuliers se voient communiquer le prix toutes taxes comprises avant toute commande.';

/* ------------------------------------------------------------------ */
/* Mentions légales — LCEN, article 1-1                                */
/* ------------------------------------------------------------------ */

export const LEGAL_NOTICE_SECTIONS: LegalSection[] = [
  {
    id: 'editeur',
    title: '1. Éditeur du site',
    paragraphs: [
      `Le site et le service ${PRODUCT} sont édités par :`,
    ],
    list: [
      `${EDITOR.legalName}`,
      `Forme juridique : ${EDITOR.legalForm}`,
      ...(EDITOR.capital ? [`Capital social : ${EDITOR.capital}`] : []),
      `Siège social : ${editorAddressLine()}`,
      ...(EDITOR.siren ? [`Immatriculation : ${EDITOR.siren}${EDITOR.rcsCity ? ` (RCS ${EDITOR.rcsCity})` : ''}`] : []),
      ...(EDITOR.vatNumber ? [`TVA intracommunautaire : ${EDITOR.vatNumber}`] : []),
      `Téléphone : ${EDITOR.phone}`,
      `Courriel : ${EDITOR.email}`,
    ],
  },
  {
    id: 'fondement',
    title: '2. Fondement de ces mentions',
    paragraphs: [
      'Les présentes mentions sont établies en application de l’article 1-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).',
      'Depuis la loi n° 2024-449 du 21 mai 2024 (loi SREN), l’obligation d’identification de l’éditeur ne figure plus à l’article 6-III de cette loi, qui traite désormais des seuls services intermédiaires. Le non-respect de cette obligation est réprimé par l’article 1-2 de la même loi.',
    ],
  },
  {
    id: 'publication',
    title: '3. Directeur de la publication',
    paragraphs: [
      `Le directeur de la publication est ${EDITOR.publicationDirector}, en sa qualité de représentant légal de ${EDITOR.legalName}.`,
    ],
  },
  {
    id: 'hebergeur',
    title: '4. Hébergement',
    paragraphs: [
      'Le site est hébergé par :',
    ],
    list: [
      HOST.name,
      HOST.address,
      `Téléphone : ${HOST.phone}`,
      `Site : ${HOST.website}`,
    ],
  },
  {
    id: 'nature',
    title: '5. Nature du service',
    paragraphs: [
      `${PRODUCT} est une application web qui s’exécute intégralement dans le navigateur du client. Les données de gestion des créances (factures, paiements, relances, engagements) sont enregistrées dans la base de données locale du navigateur (IndexedDB) et ne sont jamais transmises à l’éditeur ni à l’hébergeur.`,
      'L’hébergement ne concerne donc que les fichiers statiques du site (pages, scripts, feuilles de style) et les journaux techniques produits par l’hébergeur lors des requêtes HTTP.',
    ],
  },
  {
    id: 'propriete',
    title: '6. Propriété intellectuelle',
    paragraphs: [
      `La structure du site, les textes, les interfaces et le code source de ${PRODUCT} sont protégés par le droit d’auteur et par le droit des bases de données. Toute reproduction, représentation, adaptation ou exploitation non autorisée, totale ou partielle, est interdite.`,
      'Le code source est distribué sous licence Apache 2.0 ; cette licence ne confère aucun droit sur la marque, les signes distinctifs ni les contenus rédactionnels.',
      'Les données saisies par le client lui appartiennent exclusivement.',
    ],
  },
  {
    id: 'donnees',
    title: '7. Données personnelles',
    paragraphs: [
      'Le détail des traitements, des durées de conservation et des droits est décrit dans la politique de confidentialité.',
    ],
    link: { label: 'Politique de confidentialité', path: '/confidentialite' },
  },
  {
    id: 'signalement',
    title: '8. Signalement de contenus illicites',
    paragraphs: [
      `Tout contenu susceptible d’être illicite peut être signalé à l’adresse ${EDITOR.email}. Les signalements sont traités dans les meilleurs délais.`,
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Conditions générales de vente                                       */
/* ------------------------------------------------------------------ */

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: '1. Objet et champ d’application',
    paragraphs: [
      `Les présentes conditions générales de vente régissent la fourniture de licences d’utilisation du logiciel ${PRODUCT} par ${EDITOR.legalName} (ci-après « l’Éditeur ») à ses clients (ci-après « le Client »).`,
      'Elles s’appliquent de plein droit à toute commande. Toute condition contraire du Client est inopposable à l’Éditeur, sauf acceptation écrite et préalable.',
      'Le Client reconnaît avoir pris connaissance des présentes conditions avant la conclusion du contrat. En application de l’article L441-1 du Code de commerce, elles sont communiquées à tout acheteur professionnel qui en fait la demande.',
    ],
  },
  {
    id: 'service',
    title: '2. Description du service',
    paragraphs: [
      `${PRODUCT} est un logiciel de pilotage du recouvrement de créances : import de factures, balance âgée, notation du risque, priorisation des relances, journal des actions, engagements de paiement, litiges, calculateur d’intérêts de retard, export CSV et sauvegarde JSON.`,
      'Le logiciel fonctionne intégralement dans le navigateur du Client. Aucune base de données distante n’est utilisée : les données de gestion des créances restent sur le poste du Client.',
      'En conséquence, l’Éditeur n’a techniquement aucun accès aux données du Client et ne peut ni les consulter, ni les modifier, ni les restaurer.',
    ],
  },
  {
    id: 'commande',
    title: '3. Commande',
    paragraphs: [
      'La commande est conclue par échange écrit entre le Client et l’Éditeur : demande du Client, émission d’une facture, règlement, puis communication de la clé de licence. Aucun paiement en ligne automatique n’est réalisé sur le site.',
      'La facture tient lieu de confirmation de commande. Elle mentionne les références de l’offre souscrite, le nombre de postes et le montant dû.',
    ],
  },
  {
    id: 'prix',
    title: '4. Prix',
    list: priceList(),
    paragraphs: [vatSentence()],
  },
  {
    id: 'paiement',
    title: '5. Modalités et délais de paiement',
    paragraphs: [
      'Sauf conditions particulières figurant sur la facture, le règlement est dû à réception de la facture, par virement bancaire.',
      'Conformément aux articles L441-10 et D441-5 du Code de commerce, tout retard de paiement entraîne de plein droit : des pénalités de retard calculées au taux d’intérêt légal majoré de dix points, et une indemnité forfaitaire pour frais de recouvrement de 40 € par facture impayée.',
      'Aucun escompte n’est accordé pour paiement anticipé.',
      'Le délai de paiement convenu ne peut excéder, entre professionnels, soixante jours à compter de la date d’émission de la facture ou quarante-cinq jours fin de mois.',
    ],
  },
  {
    id: 'livraison',
    title: '6. Livraison de la licence',
    paragraphs: [
      'La clé de licence au format RRV-… est adressée par courrier électronique à l’adresse indiquée par le Client, après encaissement du règlement.',
      'La clé est générée manuellement par l’Éditeur à partir de sa propre infrastructure ; elle n’est ni devinable ni liée à une vérification en ligne.',
      'La saisie de la clé dans le logiciel active le plan correspondant sur l’appareil du Client. Aucune connexion internet n’est requise pour cette activation.',
    ],
  },
  {
    id: 'licence',
    title: '7. Licence d’utilisation',
    paragraphs: [
      'L’Éditeur concède au Client un droit d’usage personnel, non exclusif, non transférable et non cessible du logiciel, pour la durée du plan souscrit et dans la limite du nombre de postes prévu.',
      'Le Client peut effectuer les copies de sauvegarde nécessaires à l’usage normal du logiciel. Toute décompilation ou désassemblage n’est autorisé que dans les limites strictement prévues par l’article L122-6-1 du Code de la propriété intellectuelle.',
      'Le Client ne peut ni revendre, ni louer, ni sous-licencier la clé, ni l’utiliser au-delà du nombre de postes déclaré.',
    ],
  },
  {
    id: 'essai',
    title: '8. Essai gratuit',
    paragraphs: [
      `L’essai gratuit permet d’utiliser l’ensemble des fonctionnalités pendant quatorze jours à compter de la création de l’espace, sans carte bancaire et sans engagement.`,
      'À l’issue de l’essai, l’accès aux fonctions demeure possible mais le plan n’est plus couvert : le Client régularise en saisissant une clé payante. Les données déjà saisies ne sont pas supprimées du fait de l’expiration de l’essai.',
    ],
  },
  {
    id: 'duree',
    title: '9. Durée et résiliation',
    paragraphs: [
      'L’abonnement est souscrit pour la durée indiquée sur la facture. Sauf mention contraire, il est conclu pour une durée d’un mois ou d’un an et n’est pas reconduit tacitement : la reconduction suppose une nouvelle commande.',
      'En cas de manquement grave du Client aux présentes conditions, l’Éditeur peut résilier l’abonnement après mise en demeure restée sans effet pendant quinze jours. Les sommes dues au titre de la période en cours restent exigibles.',
      'La résiliation ne donne pas lieu à restitution des données détenues par le Client : celles-ci sont stockées sur son propre appareil et demeurent sous son contrôle exclusif.',
    ],
  },
  {
    id: 'retractation',
    title: '10. Droit de rétractation',
    paragraphs: [
      'Le droit de rétractation ne bénéficie qu’aux personnes physiques agissant à des fins n’entrant pas dans le cadre de leur activité commerciale, industrielle, artisanale ou libérale (« consommateurs »). Les contrats conclus entre professionnels n’ouvrent pas de droit de rétractation.',
      'Pour un client consommateur, le délai de rétractation est de quatorze jours à compter de la conclusion du contrat, conformément à l’article L221-18 du Code de la consommation.',
      'Conformément à l’article L221-28, 13° du même code, ce droit ne peut être exercé pour la fourniture d’un contenu numérique sans support matériel lorsque l’exécution a commencé avec l’accord préalable exprès du consommateur et son renoncement exprès à son droit de rétractation. Ce double accord est recueilli avant la communication de la clé ; à défaut, le délai de quatorze jours s’applique.',
      'Les modalités concrètes d’exercice figurent sur la page de rétractation.',
    ],
    link: { label: 'Exercer mon droit de rétractation', path: '/retractation' },
  },
  {
    id: 'conformite',
    title: '11. Garantie légale de conformité',
    paragraphs: [
      'Le Client consommateur bénéficie de la garantie légale de conformité applicable aux contenus et services numériques (articles L224-25-12 et suivants du Code de la consommation). Il peut obtenir la mise en conformité du logiciel ou, à défaut, une réduction du prix ou la résolution du contrat dans les conditions prévues par ces articles.',
      'L’Éditeur informe le Client des mises à jour nécessaires au maintien de la conformité du logiciel et l’indemnise en cas de défaut de conformité résultant d’une telle mise à jour.',
      'Les dispositions du présent article ne s’appliquent pas aux clients professionnels, pour lesquels les garanties légales du Code civil s’appliquent dans leur régime de droit commun.',
    ],
  },
  {
    id: 'sauvegarde',
    title: '12. Sauvegarde des données — clause essentielle',
    paragraphs: [
      'Le Client est seul responsable de la sauvegarde de ses données. Le logiciel met à sa disposition un export de sauvegarde au format JSON ainsi qu’une procédure de restauration vérifiée.',
      'L’Éditeur ne dispose d’aucune copie des données du Client et ne peut donc procéder à aucune restauration, ni récupérer quelque donnée que ce soit en cas de perte de l’appareil, de suppression du profil de navigation, de réinitialisation du navigateur ou d’effacement des données locales par l’utilisateur ou par un tiers.',
      'Le Client professionnel reconnaît que cette absence de conservation à distance est une caractéristique substantielle du service, et qu’il lui appartient d’organiser une sauvegarde régulière, notamment avant toute opération de mise à jour du navigateur ou du système.',
    ],
  },
  {
    id: 'responsabilite',
    title: '13. Responsabilité',
    paragraphs: [
      'L’Éditeur est tenu à une obligation de moyens. Il ne garantit pas que le logiciel sera exempt de toute erreur ni que son usage produira un résultat financier déterminé.',
      'Les indicateurs fournis — balance âgée, score de risque, courbe de recouvrement prévisionnelle (CRF) — sont des outils d’aide à la décision fondés sur des règles internes explicites. Ils ne constituent ni une opinion comptable, ni une évaluation au sens d’un référentiel réglementaire, ni une provision au sens des normes IFRS 9 ou CECL.',
      'La responsabilité de l’Éditeur ne peut être engagée pour les décisions de gestion, de crédit ou de recouvrement prises par le Client sur la base des indicateurs du logiciel.',
      'Sauf faute lourde ou dommage corporel, la responsabilité totale de l’Éditeur au titre du contrat est plafonnée au montant effectivement payé par le Client au cours des douze mois précédant le fait générateur.',
    ],
  },
  {
    id: 'donnees-personnelles',
    title: '14. Données personnelles',
    paragraphs: [
      'Le Client demeure responsable des données personnelles qu’il enregistre dans le logiciel (coordonnées de ses propres clients). Il lui appartient de respecter les obligations qui lui incombent à ce titre, notamment l’information des personnes concernées.',
      'Les traitements réalisés par l’Éditeur en qualité de responsable de traitement sont décrits dans la politique de confidentialité.',
    ],
    link: { label: 'Politique de confidentialité', path: '/confidentialite' },
  },
  {
    id: 'force-majeure',
    title: '15. Force majeure',
    paragraphs: [
      'Aucune partie ne peut être tenue responsable d’un manquement résultant d’un événement de force majeure au sens de l’article 1218 du Code civil. Les obligations sont suspendues pendant la durée de l’événement.',
    ],
  },
  {
    id: 'reclamations',
    title: '16. Réclamations et médiation',
    paragraphs: [
      `Toute réclamation doit être adressée par écrit à ${EDITOR.email}. L’Éditeur s’engage à en accuser réception et à y répondre dans un délai de quinze jours ouvrés.`,
      'Conformément à l’article L616-1 du Code de la consommation, le Client consommateur peut recourir gratuitement à un médiateur de la consommation agréé, après une réclamation écrite préalable restée sans solution satisfaisante.',
      EDITOR.mediator
        ? `Médiateur compétent : ${EDITOR.mediator.name}, ${EDITOR.mediator.address}, ${EDITOR.mediator.website}.`
        : 'le médiateur compétent n’est pas encore désigné : cette information sera communiquée avant toute vente à un consommateur.',
      'La plateforme européenne de règlement en ligne des litiges (RLL/ODR) a été fermée définitivement le 20 juillet 2025 : aucun lien vers ce service n’est donc proposé.',
    ],
  },
  {
    id: 'droit-applicable',
    title: '17. Droit applicable et juridiction',
    paragraphs: [
      'Les présentes conditions sont soumises au droit français.',
      'Les litiges avec un Client professionnel relèvent de la compétence exclusive du tribunal de commerce du ressort du siège de l’Éditeur, sauf disposition légale contraire.',
      'Les litiges avec un Client consommateur relèvent des règles de compétence de droit commun du Code de la consommation, qui permettent notamment au consommateur de saisir la juridiction de son lieu de domicile.',
    ],
  },
  {
    id: 'divers',
    title: '18. Dispositions diverses',
    paragraphs: [
      'Si une clause des présentes conditions était déclarée nulle, les autres clauses conserveraient leur plein effet.',
      'L’Éditeur peut modifier les présentes conditions pour les commandes futures ; les conditions applicables sont celles en vigueur à la date de la commande.',
      'Le fait pour l’Éditeur de ne pas se prévaloir d’un manquement ne vaut pas renonciation à s’en prévaloir ultérieurement.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Politique de confidentialité — RGPD, articles 13 et 14              */
/* ------------------------------------------------------------------ */

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    title: '1. Responsable de traitement',
    paragraphs: [
      `Le responsable des traitements décrits ci-dessous est ${EDITOR.legalName}, ${editorAddressLine()}.`,
      `Contact pour toute question relative aux données personnelles : ${EDITOR.email}.`,
    ],
  },
  {
    id: 'principe',
    title: '2. Principe directeur : vos données financières ne quittent pas votre appareil',
    paragraphs: [
      `${PRODUCT} ne comporte aucun serveur applicatif. Les factures, paiements, engagements, litiges et relances que vous enregistrez sont stockés dans la base IndexedDB de votre navigateur. Ils ne sont transmis ni à l’Éditeur, ni à l’hébergeur, ni à un sous-traitant.`,
      'L’Éditeur n’a donc aucun accès technique à ces données. Il ne peut ni les consulter, ni les exporter, ni les restaurer, ni les supprimer à distance. Cette absence d’accès est une garantie de confidentialité, mais implique que la sauvegarde relève de votre responsabilité.',
      'Le mot de passe de votre espace local n’est jamais transmis : il est transformé en empreinte (PBKDF2-SHA256, 120 000 itérations) et cette empreinte est stockée localement, dans votre navigateur.',
    ],
  },
  {
    id: 'traites',
    title: '3. Données effectivement traitées par l’Éditeur',
    paragraphs: [
      'Trois catégories de données seulement sont traitées côté Éditeur :',
    ],
    list: [
      'Données de commande et de facturation (professionnel) : raison sociale, adresse, identifiant fiscal, nom et coordonnées du contact, historique des commandes et des paiements.',
      'Données de correspondance : messages que vous adressez au support, y compris l’adresse électronique utilisée.',
      'Journaux techniques de l’hébergeur : adresse IP, horodatage, pages demandées et agent utilisateur, conservés par l’hébergeur lors de chaque requête HTTP, pour la sécurité et le diagnostic d’incident.',
    ],
  },
  {
    id: 'finalites',
    title: '4. Finalités et bases légales',
    paragraphs: [
      'Chaque traitement repose sur une base légale distincte, conformément à l’article 6 du RGPD :',
    ],
    list: [
      'Gestion des commandes, de la facturation et de la relation commerciale : exécution du contrat (article 6.1.b).',
      'Génération et délivrance des clés de licence : exécution du contrat (article 6.1.b).',
      'Conservation des pièces comptables : obligation légale (article 6.1.c), dix ans à compter de la clôture de l’exercice.',
      'Sécurité du site et prévention des abus : intérêt légitime (article 6.1.f).',
      'Réponse aux demandes de support : exécution du contrat ou intérêt légitime selon la nature de la demande.',
    ],
  },
  {
    id: 'durees',
    title: '5. Durées de conservation',
    list: [
      'Dossier client et factures : dix ans à compter de la clôture de l’exercice, au titre des obligations comptables.',
      'Correspondance de support : trois ans à compter du dernier échange.',
      'Journaux techniques de l’hébergeur : durée fixée par l’hébergeur, de l’ordre de quelques jours à quelques semaines selon le service.',
      'Prospect n’ayant pas donné suite : trois ans à compter du dernier contact.',
    ],
  },
  {
    id: 'destinataires',
    title: '6. Destinataires et sous-traitants',
    paragraphs: [
      'Les données ne sont ni vendues, ni louées, ni cédées à des fins publicitaires. Elles sont accessibles au seul éditeur et aux prestataires strictement nécessaires :',
    ],
    list: [
      `Hébergement du site : ${HOST.name}, ${HOST.address}.`,
      'Messagerie électronique : le prestataire utilisé pour l’envoi des clés de licence et des factures.',
      'Comptabilité : l’expert-comptable ou le service de comptabilité de l’Éditeur, soumis au secret professionnel.',
    ],
  },
  {
    id: 'transferts',
    title: '7. Transferts hors Union européenne',
    paragraphs: [
      'L’hébergement du site est assuré par un prestataire établi aux États-Unis. Les requêtes vers le site (adresse IP, agent utilisateur, horodatage) peuvent donc transiter par un réseau de diffusion international.',
      'Aucune donnée de gestion de créances n’est concernée par ces transferts, puisqu’elle ne quitte jamais votre navigateur.',
      'Les transferts éventuels de données de facturation reposent sur les clauses contractuelles types de la Commission européenne et, le cas échéant, sur le cadre de protection des données UE–États-Unis.',
    ],
  },
  {
    id: 'droits',
    title: '8. Vos droits',
    paragraphs: [
      'Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité prévus aux articles 15 à 20 du RGPD, ainsi que du droit de retirer votre consentement lorsqu’un traitement repose sur celui-ci.',
      `Pour exercer ces droits, écrivez à ${EDITOR.email}. Une réponse est apportée dans un délai d’un mois, pouvant être prolongé de deux mois pour les demandes complexes.`,
      'Les données enregistrées dans votre navigateur peuvent être supprimées directement par vous : l’application met à disposition un export de sauvegarde et la suppression de l’espace local. L’Éditeur n’ayant aucun accès à ces données, il ne peut ni les fournir, ni les effacer à votre place.',
      'En cas de désaccord persistant, vous pouvez introduire une réclamation auprès de la Commission nationale de l’informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, ou en ligne sur cnil.fr.',
    ],
  },
  {
    id: 'cookies',
    title: '9. Cookies et traceurs',
    paragraphs: [
      'Le site ne dépose aucun cookie publicitaire, aucun cookie de mesure d’audience tiers et aucun traceur de réseaux sociaux.',
      'Le stockage local (IndexedDB) sert exclusivement au fonctionnement de l’application : espace de travail, organisation, jetons de session locaux. Il constitue un stockage strictement nécessaire et ne requiert donc pas de consentement préalable.',
      'Aucun consentement n’étant requis, aucun bandeau de cookies n’est affiché — et son absence n’est pas un manquement.',
    ],
  },
  {
    id: 'securite',
    title: '10. Sécurité',
    paragraphs: [
      'Les échanges avec le site sont chiffrés en transit (HTTPS avec HSTS). Le site est servi en fichiers statiques, sans base de données exposée et sans interface d’administration distante : la surface d’attaque est volontairement réduite.',
      'Les mots de passe locaux ne sont jamais stockés en clair : seule une empreinte dérivée (PBKDF2-SHA256, sel aléatoire, 120 000 itérations) est conservée dans votre navigateur.',
      'En cas de violation de données susceptible d’engendrer un risque élevé pour vos droits, vous seriez informé dans les conditions de l’article 34 du RGPD.',
    ],
  },
  {
    id: 'mineurs',
    title: '11. Mineurs',
    paragraphs: [
      'Le service est destiné à des professionnels et n’est pas conçu pour être utilisé par des mineurs de moins de quinze ans. Aucune donnée de mineur n’est sciemment collectée par l’Éditeur.',
    ],
  },
  {
    id: 'modification',
    title: '12. Modification de la présente politique',
    paragraphs: [
      'Cette politique peut être mise à jour pour tenir compte d’une évolution légale ou d’une modification du service. La date de dernière révision figure en tête du document.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Rétractation                                                        */
/* ------------------------------------------------------------------ */

export const WITHDRAWAL_SECTIONS: LegalSection[] = [
  {
    id: 'principe',
    title: '1. Principe',
    paragraphs: [
      'Si vous agissez en qualité de consommateur — c’est-à-dire de personne physique n’agissant pas dans le cadre de votre activité professionnelle — vous disposez en principe d’un délai de quatorze jours pour vous rétracter, sans avoir à justifier votre décision ni à payer de pénalité (article L221-18 du Code de la consommation).',
      'Ce délai court à compter de la conclusion du contrat, c’est-à-dire du jour de votre commande.',
    ],
  },
  {
    id: 'exclusion',
    title: '2. Exception applicable aux contenus numériques',
    paragraphs: [
      'Conformément à l’article L221-28, 13° du Code de la consommation, le droit de rétractation ne peut être exercé pour la fourniture d’un contenu numérique sans support matériel lorsque deux conditions sont réunies : vous avez accepté que l’exécution commence avant la fin du délai de quatorze jours, et vous avez renoncé expressément à votre droit de rétractation.',
      'Cette double acceptation est recueillie par écrit avant la communication de votre clé de licence. Si vous ne l’avez pas donnée, le délai de quatorze jours s’applique normalement et vous pouvez vous rétracter.',
      'L’exception ne s’applique jamais d’office : une clause qui exclurait la rétractation sans ce double accord exprès serait inopposable.',
    ],
  },
  {
    id: 'exercice',
    title: '3. Comment exercer votre droit',
    paragraphs: [
      'Depuis le 19 juin 2026, la réglementation impose aux professionnels concluant des contrats à distance par une interface en ligne avec des consommateurs de mettre à disposition une fonctionnalité de rétractation gratuite et directement accessible (article L221-21 du Code de la consommation, modifié par l’ordonnance n° 2026-2 du 5 janvier 2026).',
      'Les ventes de Revenue Recovery OS sont conclues par échange écrit — facture puis règlement — et non par une interface de paiement en ligne. Le bouton ci-dessous est néanmoins fourni pour vous permettre d’exercer votre droit en un clic.',
      'La fonctionnalité est identifiée par les mots « renoncer au contrat ici » et reste accessible pendant toute la durée du délai de rétractation.',
      'Vous pouvez également notifier votre rétractation par tout moyen écrit, y compris le formulaire type reproduit plus bas.',
    ],
  },
  {
    id: 'formulaire',
    title: '4. Formulaire type de rétractation',
    paragraphs: [
      'À l’attention de l’éditeur, dont les coordonnées figurent dans les mentions légales :',
      '« Je vous notifie par la présente ma rétractation du contrat portant sur la fourniture du service suivant : Revenue Recovery OS — [offre souscrite]. Commandé le [date] / reçu le [date]. Nom du consommateur : [nom]. Adresse : [adresse]. Date : [date]. »',
    ],
  },
  {
    id: 'effets',
    title: '5. Effets de la rétractation',
    paragraphs: [
      'En cas de rétractation valable, le remboursement des sommes versées intervient au plus tard quatorze jours à compter de la réception de votre notification, par le même moyen de paiement que celui utilisé lors du règlement.',
      'La clé de licence associée est désactivée : elle cesse d’être valable et ne doit plus être utilisée. Vos données locales restent intactes sur votre appareil, y compris après la désactivation.',
    ],
  },
  {
    id: 'litiges',
    title: '6. Litiges',
    paragraphs: [
      'Si votre réclamation écrite n’a pas reçu de solution satisfaisante, vous pouvez recourir gratuitement au médiateur de la consommation compétent (article L616-1 du Code de la consommation).',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Vérifications automatiques                                          */
/* ------------------------------------------------------------------ */

export const ALL_LEGAL_DOCUMENTS = [
  { id: 'mentions-legales', path: '/mentions-legales', title: 'Mentions légales', sections: LEGAL_NOTICE_SECTIONS },
  { id: 'cgv', path: '/cgv', title: 'Conditions générales de vente', sections: TERMS_SECTIONS },
  { id: 'confidentialite', path: '/confidentialite', title: 'Politique de confidentialité', sections: PRIVACY_SECTIONS },
  { id: 'retractation', path: '/retractation', title: 'Droit de rétractation', sections: WITHDRAWAL_SECTIONS },
] as const;

/** Texte intégral d'un document, pour la recherche et les tests. */
export function documentText(sections: readonly LegalSection[]): string {
  return sections
    .map(s => [s.title, ...(s.paragraphs ?? []), ...(s.list ?? [])].join('\n'))
    .join('\n\n');
}
