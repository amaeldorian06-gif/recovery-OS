import {
  EDITOR_CONFIG,
  EditorConfig,
  HOST,
  displayField,
  editorAddressLine,
  editorCountry,
  isCompany,
  resolvedPublicationDirector,
  resolvedRightsHolder,
  contactEmail,
  hasValue,
  localRequiredMention,
  validateDocument,
} from '../config/editor';
import type { DocumentId } from '../config/editor';
import { PLAN_DETAILS } from '../storage/license';

// Réexportés pour les tests et pour les appelants historiques : l'implémentation
// vit désormais dans `src/config/tax.ts`, hors du bundle initial.
import { taxStatement } from '../config/tax';
export { taxStatement, shortTaxMention } from '../config/tax';

/**
 * Contenu des documents légaux.
 *
 * Deux principes gouvernent ce fichier :
 *
 *  1. **Rien n'est codé en dur sur l'éditeur.** Toute mention d'identité est lue
 *     dans `src/config/editor.ts` et rendue par `displayField`. Un champ absent
 *     apparaît comme « [à compléter] », jamais comme une valeur plausible.
 *
 *  2. **Aucune obligation nationale n'est présentée comme universelle.** Les
 *     références françaises (LCEN, Code de la consommation, Code de commerce,
 *     article 293 B du CGI) ne sont citées que pour ce qu'elles sont : des
 *     textes applicables à un éditeur établi en France, ou aux ventes conclues
 *     avec des personnes qui y résident. L'éditeur est établi au Cameroun et
 *     relève du droit OHADA : les textes cités comme fondement principal sont
 *     les siens ; les autres sont explicitement désignés comme extérieurs.
 *
 * ⚠️ Ces textes sont un socle sérieux, PAS une consultation juridique et PAS une
 * certification de conformité. Voir `docs/CONFORMITE-LEGALE.md` et l'état de
 * validation calculé par `validateDocument()`.
 */

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  /** Renvoi interne vers un autre document. */
  link?: { label: string; path: string };
}

/* ------------------------------------------------------------------ */
/* Utilitaires de rendu                                                */
/* ------------------------------------------------------------------ */

/** Nom commercial affiché du produit. */
export function productName(config: EditorConfig = EDITOR_CONFIG): string {
  return hasValue(config.identity.tradeName)
    ? (config.identity.tradeName.value as string)
    : 'Revenue Recovery OS';
}

/** Nom de l'éditeur tel qu'il doit apparaître dans une phrase. */
const editorName = (config: EditorConfig): string => displayField(config.identity.legalName);

const countryName = (config: EditorConfig): string => editorCountry(config).name;

/**
 * Bloc d'identification commun aux documents.
 * Les champs sans objet ne sont pas affichés : une mention « sans objet » n'a
 * pas sa place dans un document public, alors qu'un champ manquant, lui, doit
 * rester visible.
 */
export function identityLines(config: EditorConfig = EDITOR_CONFIG): string[] {
  const country = editorCountry(config);
  const lines: string[] = [`Éditeur : ${displayField(config.identity.legalName)}`];

  lines.push(
    isCompany(config)
      ? 'Forme : société immatriculée'
      : 'Forme : personne physique exerçant en nom personnel'
  );

  lines.push(`Adresse : ${editorAddressLine(config)}`);
  lines.push(`Téléphone : ${displayField(config.identity.phone)}`);
  lines.push(`Courriel : ${displayField(config.identity.email)}`);

  if (config.registration.identifier.state !== 'not_applicable') {
    lines.push(`${config.registration.identifierLabel} : ${displayField(config.registration.identifier)}`);
  }
  if (config.registration.taxNumber.state !== 'not_applicable') {
    const label = country.taxIdentifierLabel ?? 'Identifiant fiscal';
    lines.push(`${label} : ${displayField(config.registration.taxNumber)}`);
  }
  if (config.registration.capital.state === 'provided') {
    lines.push(`Capital social : ${displayField(config.registration.capital)}`);
  }
  if (config.registration.domesticRegistry.state !== 'not_applicable') {
    lines.push(`Registre local : ${displayField(config.registration.domesticRegistry)}`);
  }

  const mention = localRequiredMention(config);
  if (mention && hasValue(config.registration.identifier)) {
    lines.push(mention);
  }

  return lines;
}

const priceLine = (label: string, price: number, seats: number): string =>
  `${label} : ${price} € par mois et par organisation, ${seats} poste${seats > 1 ? 's' : ''}, hors taxes.`;

const priceList = (): string[] => [
  'Essai gratuit : 0 € pendant 14 jours, sans carte bancaire.',
  priceLine('Essentiel', PLAN_DETAILS.essentiel.priceMonthly, PLAN_DETAILS.essentiel.seats),
  priceLine('Professionnel', PLAN_DETAILS.pro.priceMonthly, PLAN_DETAILS.pro.seats),
  priceLine('Cabinet', PLAN_DETAILS.cabinet.priceMonthly, PLAN_DETAILS.cabinet.seats),
];

/* ------------------------------------------------------------------ */
/* Mentions légales                                                    */
/* ------------------------------------------------------------------ */

export function buildLegalNotice(config: EditorConfig = EDITOR_CONFIG): LegalSection[] {
  const country = editorCountry(config);
  const director = resolvedPublicationDirector(config);

  return [
    {
      id: 'editeur',
      title: '1. Éditeur du site',
      paragraphs: [
        `Le site et le service ${productName(config)} sont édités par :`,
      ],
      list: identityLines(config),
    },
    {
      id: 'statut',
      title: '2. Statut de l’éditeur — ce que le service n’est pas',
      paragraphs: [
        `${productName(config)} est un produit édité par une personne physique établie au ${country.name}. ` +
          'Ce n’est ni une société, ni une filiale, ni une émanation d’une société française ou européenne.',
        `Le nom ${productName(config)} est un nom commercial. Il ne désigne aucune personne morale et ne confère ` +
          'aucune personnalité juridique distincte de celle de l’éditeur.',
        isCompany(config)
          ? 'L’éditeur est une personne morale : son immatriculation et son capital sont indiqués ci-dessus.'
          : 'L’éditeur n’a pas de capital social, de siège social ni d’immatriculation au registre du commerce et du crédit mobilier en qualité de société. ' +
            'Aucun numéro SIREN, SIRET, RCS ou greffe français ne lui est attribué.',
      ],
    },
    {
      id: 'fondement',
      title: '3. Fondement de ces mentions',
      paragraphs: [
        `Ces mentions sont établies en application du droit applicable au ${country.name}` +
          (country.legalSystem === 'ohada'
            ? ' et des actes uniformes de l’Organisation pour l’harmonisation en Afrique du droit des affaires (OHADA).'
            : '.'),
        country.individualRegistry?.note
          ? `Concernant l’activité exercée à titre personnel : ${country.individualRegistry.note}`
          : 'Les obligations d’immatriculation applicables à une personne physique doivent être vérifiées.',
        'À titre volontaire, l’éditeur reprend également les informations que la loi française impose aux éditeurs établis en France ' +
          '(loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, article 1-1, dans sa rédaction issue de la loi n° 2024-449 du 21 mai 2024). ' +
          'Cette reprise est un choix de transparence : elle ne vaut pas reconnaissance d’un établissement en France ni d’une sujétion à ce texte.',
        'L’absence d’immatriculation française n’est ni une omission, ni une irrégularité : elle résulte du pays d’établissement de l’éditeur.',
      ],
    },
    {
      id: 'publication',
      title: '4. Directeur de la publication',
      paragraphs: [
        isCompany(config)
          ? `Le directeur de la publication est ${displayField(director)}, désigné par l’éditeur.`
          : `Le directeur de la publication est l’éditeur lui-même, ${displayField(director)}, personne physique.`,
        `Contact de la direction de la publication : ${displayField(config.identity.email)}.`,
      ],
    },
    {
      id: 'hebergeur',
      title: '5. Hébergement',
      paragraphs: ['Le site est hébergé par :'],
      list: [
        HOST.name,
        HOST.address,
        `Téléphone : ${HOST.phone} (${HOST.phoneNote})`,
        `Courriel : ${HOST.email}`,
        `Site : ${HOST.website}`,
      ],
    },
    {
      id: 'nature',
      title: '6. Nature du service',
      paragraphs: [
        `${productName(config)} est une application web qui s’exécute intégralement dans le navigateur du client. ` +
          'Les données de gestion des créances (factures, paiements, relances, engagements) sont enregistrées dans la base ' +
          'de données locale du navigateur (IndexedDB) et ne sont jamais transmises à l’éditeur ni à l’hébergeur.',
        'L’hébergement ne concerne donc que les fichiers statiques du site (pages, scripts, feuilles de style) et les journaux ' +
          'techniques produits par l’hébergeur lors des requêtes HTTP.',
      ],
    },
    {
      id: 'propriete',
      title: '7. Propriété intellectuelle',
      paragraphs: [
        `La structure du site, les textes, les interfaces et le code source de ${productName(config)} sont protégés par le droit ` +
          'd’auteur et, le cas échéant, par le droit des bases de données.',
        `Titulaire des droits : ${displayField(resolvedRightsHolder(config))}.`,
        config.rights.holderNote.state === 'provided' && config.rights.holderNote.value
          ? config.rights.holderNote.value
          : 'Les conditions de réutilisation du code source sont précisées dans le dépôt du projet.',
        'Les données saisies par le client lui appartiennent exclusivement.',
      ],
    },
    {
      id: 'donnees',
      title: '8. Données personnelles',
      paragraphs: [
        'Le détail des traitements, des durées de conservation, des transferts et des droits est décrit dans la politique de confidentialité.',
      ],
      link: { label: 'Politique de confidentialité', path: '/confidentialite' },
    },
    {
      id: 'signalement',
      title: '9. Signalement de contenus illicites',
      paragraphs: [
        `Tout contenu susceptible d’être illicite peut être signalé à l’adresse ${contactEmail(config)}. ` +
          'Les signalements sont traités dans les meilleurs délais.',
        'L’hébergeur dispose par ailleurs de sa propre procédure de signalement, indiquée ci-dessus.',
      ],
    },
    {
      id: 'documents',
      title: '10. Documents contractuels',
      paragraphs: [
        'Les conditions d’utilisation du site et du logiciel, les conditions de vente et la politique de confidentialité ' +
          'complètent les présentes mentions. Ils prévalent sur toute autre communication commerciale.',
      ],
      link: { label: 'Conditions générales d’utilisation', path: '/cgu' },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Conditions générales d'utilisation                                  */
/* ------------------------------------------------------------------ */

export function buildTermsOfUse(config: EditorConfig = EDITOR_CONFIG): LegalSection[] {
  const name = editorName(config);
  const product = productName(config);

  return [
    {
      id: 'objet',
      title: '1. Objet',
      paragraphs: [
        `Les présentes conditions générales d’utilisation (CGU) régissent l’accès au site et l’usage du logiciel ${product}, ` +
          `édité par ${name} (ci-après « l’Éditeur »).`,
        'Elles ne se confondent pas avec les conditions générales de vente, qui régissent la souscription d’une licence payante. ' +
          'L’usage du logiciel en essai gratuit ou sous licence souscrite suppose l’acceptation des deux documents.',
        'Elles s’appliquent à toute personne qui accède au site ou utilise le logiciel (ci-après « l’Utilisateur »).',
      ],
      link: { label: 'Conditions générales de vente', path: '/cgv' },
    },
    {
      id: 'acceptation',
      title: '2. Acceptation',
      paragraphs: [
        'L’utilisation du site vaut acceptation des présentes conditions. L’Utilisateur qui ne les accepte pas doit cesser d’utiliser le service.',
        'L’Éditeur peut modifier les présentes conditions pour les usages futurs ; la version applicable est celle en vigueur au moment de l’usage. ' +
          'La date de dernière révision figure en tête de chaque document.',
      ],
    },
    {
      id: 'acces',
      title: '3. Accès au service et disponibilité',
      paragraphs: [
        `${product} est servi sous forme de fichiers statiques. Aucun serveur applicatif n’est nécessaire au fonctionnement courant, ` +
          'et l’essentiel des fonctions reste disponible sans connexion internet.',
        'L’Éditeur s’efforce de maintenir le site accessible, sans garantir une disponibilité ininterrompue. Il peut suspendre l’accès ' +
          'pour maintenance, mise à jour ou raison de sécurité, sans que cela ouvre droit à indemnité.',
        'L’Utilisateur doit disposer d’un navigateur récent prenant en charge IndexedDB et Web Crypto. L’Éditeur ne garantit pas le ' +
          'fonctionnement sur les navigateurs anciens ou sur les modes de navigation restreignant le stockage local.',
      ],
    },
    {
      id: 'compte',
      title: '4. Espace local et confidentialité du mot de passe',
      paragraphs: [
        'L’espace de travail est créé et conservé dans le navigateur de l’Utilisateur. Il n’existe aucun compte hébergé, aucune base de ' +
          'données distante et aucune récupération de mot de passe par l’Éditeur.',
        'Le mot de passe local n’est jamais transmis ni stocké en clair : seule une empreinte dérivée (PBKDF2-SHA256) est conservée ' +
          'dans le navigateur. L’Utilisateur est seul responsable de la confidentialité de son mot de passe et de la sauvegarde de ses données.',
        'La suppression des données du navigateur, une réinitialisation du profil ou un changement d’appareil entraîne la perte de l’espace ' +
          'local s’il n’a pas été sauvegardé au préalable.',
      ],
    },
    {
      id: 'licence',
      title: '5. Licence d’utilisation',
      paragraphs: [
        `Le logiciel est concédé en licence, et non vendu. Les conditions financières, la durée et le nombre de postes sont fixés par les ` +
          'conditions générales de vente et par la facture.',
        'Le code source du projet est distribué sous licence Apache 2.0. Cette licence porte sur le code : elle ne confère aucun droit sur ' +
          'la marque, les signes distinctifs, les textes du site ni les contenus rédactionnels.',
        'Toute utilisation au-delà des droits concédés est interdite.',
      ],
      link: { label: 'Conditions générales de vente', path: '/cgv' },
    },
    {
      id: 'propriete',
      title: '6. Propriété intellectuelle',
      paragraphs: [
        `Le site, son habillage, ses textes et ses interfaces sont protégés par le droit d’auteur. Toute reproduction, représentation, ` +
          'adaptation ou exploitation non autorisée, totale ou partielle, est interdite.',
        `Titulaire des droits : ${displayField(resolvedRightsHolder(config))}.`,
        'Les données que l’Utilisateur enregistre dans le logiciel lui appartiennent. L’Éditeur n’en revendique aucun droit et n’y a aucun accès.',
      ],
    },
    {
      id: 'usages',
      title: '7. Usages interdits',
      list: [
        'Tenter d’accéder à des données qui ne sont pas les siennes, ou contourner les mécanismes d’authentification locale.',
        'Diffuser un contenu illicite, diffamatoire ou portant atteinte aux droits de tiers par l’intermédiaire du service.',
        'Extraire ou réutiliser de manière substantielle le contenu du site sans autorisation.',
        'Présenter le service comme une émanation d’une société tierce, d’un établissement bancaire ou d’un organisme de certification.',
        'Utiliser le service pour produire des documents trompeurs, notamment des relances ou des mises en demeure contrefaites.',
        'Contourner les limitations techniques du plan souscrit ou partager une clé de licence au-delà du nombre de postes autorisé.',
      ],
      paragraphs: [
        'Tout manquement peut entraîner la suspension de l’accès et, le cas échéant, la résiliation de la licence dans les conditions prévues ' +
          'par les conditions générales de vente.',
      ],
    },
    {
      id: 'responsabilite',
      title: '8. Responsabilité et nature des indicateurs',
      paragraphs: [
        `L’Éditeur fournit un outil d’aide à la décision, pas une prestation de conseil juridique, comptable ou financier. ` +
          'Les indicateurs produits — balance âgée, score de risque, courbe de recouvrement prévisionnelle — résultent de règles internes explicites.',
        'Ils ne constituent ni une opinion comptable, ni une évaluation au sens d’un référentiel réglementaire, ni une provision au sens des ' +
          'normes IFRS 9 ou CECL. Aucune conformité à ces référentiels n’est revendiquée.',
        'Les décisions de crédit, de recouvrement ou de contentieux prises sur la base de ces indicateurs relèvent de l’Utilisateur. ' +
          'L’Éditeur ne peut être tenu responsable des conséquences de ces décisions.',
      ],
    },
    {
      id: 'tiers',
      title: '9. Services tiers et canaux de distribution',
      paragraphs: [
        'Le site peut renvoyer vers des plateformes de distribution ou de paiement tierces. Leur utilisation est régie par leurs propres ' +
          'conditions, que l’Utilisateur doit consulter.',
        config.channels.length > 0
          ? `Les canaux de distribution actuellement identifiés sont : ${config.channels.map(channel => channel.name).join(', ')}. ` +
            'Leur rôle contractuel exact — revendeur, mandataire ou prestataire de paiement — est en cours de vérification et sera précisé ' +
            'dans les conditions générales de vente dès qu’il sera établi.'
          : 'Aucun canal de distribution tiers n’est actuellement utilisé.',
        `L’Éditeur demeure l’éditeur du logiciel et le titulaire des droits, quel que soit le canal utilisé pour l’achat. ` +
          'Une plateforme de distribution n’est ni éditrice, ni propriétaire du logiciel.',
      ],
    },
    {
      id: 'modification',
      title: '10. Modification et résiliation de l’accès',
      paragraphs: [
        'L’Éditeur peut faire évoluer le service, en ajouter ou en retirer des fonctionnalités. Une suppression de fonctionnalité substantielle ' +
          'est annoncée sur le site avant sa mise en œuvre.',
        'L’accès peut être suspendu en cas de manquement grave aux présentes conditions, après information de l’Utilisateur lorsque les ' +
          'circonstances le permettent.',
      ],
    },
    {
      id: 'droit-applicable',
      title: '11. Droit applicable et juridiction',
      paragraphs: [
        `Les présentes conditions sont soumises au droit applicable au ${countryName(config)}` +
          (editorCountry(config).legalSystem === 'ohada' ? ' et aux actes uniformes de l’OHADA' : '') + '.',
        'Les litiges relatifs à l’interprétation ou à l’exécution des présentes relèvent des juridictions compétentes du lieu d’établissement ' +
          'de l’Éditeur, sauf disposition impérative contraire applicable à un consommateur.',
        'Une solution amiable est recherchée avant toute action contentieuse : voir la section réclamations des conditions générales de vente.',
      ],
    },
    {
      id: 'contact',
      title: '12. Contact',
      paragraphs: [
        `Toute question relative aux présentes conditions peut être adressée à ${contactEmail(config)}.`,
        `Éditeur : ${displayField(config.identity.legalName)} — ${editorAddressLine(config)}.`,
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Conditions générales de vente                                       */
/* ------------------------------------------------------------------ */

export function buildTermsOfSale(config: EditorConfig = EDITOR_CONFIG): LegalSection[] {
  const name = editorName(config);
  const product = productName(config);
  const b2b = config.salesScope === 'b2b';
  const country = editorCountry(config);

  return [
    {
      id: 'objet',
      title: '1. Objet et champ d’application',
      paragraphs: [
        `Les présentes conditions générales de vente régissent la fourniture de licences d’utilisation du logiciel ${product} ` +
          `par ${name} (ci-après « l’Éditeur ») à ses clients (ci-après « le Client »).`,
        ...(b2b
          ? [
              'Le service est proposé aux professionnels. Le Client déclare agir dans le cadre de son activité professionnelle et disposer ' +
                'de la capacité de contracter à cette fin.',
              'Les offres ne sont pas proposées aux consommateurs. Si un contrat était néanmoins conclu avec une personne agissant à des fins ' +
                'non professionnelles, les dispositions impératives qui la protègent dans son pays de résidence prévaudraient sur toute clause contraire.',
            ]
          : [
              'Le service est proposé aux professionnels comme aux particuliers. Lorsque le Client agit en qualité de consommateur, les ' +
                'dispositions impératives de protection qui lui sont applicables prévalent sur les présentes conditions.',
            ]),
        'Elles s’appliquent à toute commande passée directement auprès de l’Éditeur ou par l’intermédiaire d’un canal de distribution ' +
          'mentionné à l’article 4. Toute condition contraire du Client est inopposable à l’Éditeur, sauf acceptation écrite et préalable.',
        'Le Client reconnaît avoir pris connaissance des présentes conditions avant la conclusion du contrat et les accepte sans réserve.',
      ],
    },
    {
      id: 'service',
      title: '2. Description du service',
      paragraphs: [
        `${product} est un logiciel de pilotage du recouvrement de créances : import de factures, balance âgée, notation du risque, ` +
          'priorisation des relances, journal des actions, engagements de paiement, litiges, calculateur d’intérêts de retard, export CSV ' +
          'et sauvegarde JSON.',
        'Le logiciel fonctionne intégralement dans le navigateur du Client. Aucune base de données distante n’est utilisée : les données de ' +
          'gestion des créances restent sur le poste du Client.',
        'En conséquence, l’Éditeur n’a techniquement aucun accès aux données du Client et ne peut ni les consulter, ni les modifier, ni les restaurer.',
      ],
    },
    {
      id: 'commande',
      title: '3. Commande',
      paragraphs: [
        'La commande directe est conclue par échange écrit entre le Client et l’Éditeur : demande du Client, émission d’une facture, ' +
          'règlement, puis communication de la clé de licence. Aucun paiement en ligne automatique n’est réalisé sur le site.',
        'La facture tient lieu de confirmation de commande. Elle mentionne les références de l’offre souscrite, le nombre de postes et le ' +
          'montant dû.',
      ],
    },
    {
      id: 'canaux',
      title: '4. Achat par l’intermédiaire d’une plateforme de distribution',
      paragraphs: [
        config.channels.length > 0
          ? `Les licences peuvent également être acquises auprès de : ${config.channels.map(channel => channel.name).join(', ')}.`
          : 'Aucune vente n’est réalisée par l’intermédiaire d’une plateforme tierce à ce jour.',
        ...(config.channels.length > 0
          ? [
              'Dans ce cas, la commande, l’encaissement et la délivrance du fichier ou de la clé s’effectuent sur la plateforme, selon ses ' +
                'propres conditions générales, que le Client doit consulter. La plateforme agit comme intermédiaire technique de vente.',
              'La qualification exacte du rôle de la plateforme — revendeur, mandataire du vendeur, prestataire de paiement ou vendeur ' +
                'juridique (merchant of record) — n’est pas encore établie par une pièce contractuelle. Elle déterminera, une fois tranchée, ' +
                'qui est le vendeur au sens contractuel, qui émet la facture et qui traite les remboursements. Cette information sera reprise ' +
                'dans les présentes conditions.',
              'En tout état de cause, la plateforme n’est ni l’éditeur du logiciel, ni le titulaire des droits de propriété intellectuelle : ' +
                `ces qualités appartiennent à ${name}.`,
            ]
          : []),
      ],
    },
    {
      id: 'prix',
      title: '5. Prix',
      list: priceList(),
      paragraphs: [
        taxStatement(config),
        'Les prix peuvent évoluer. Le prix applicable est celui en vigueur à la date de la commande, repris sur la facture.',
        'Le Client professionnel supporte les éventuels frais bancaires liés au règlement international ; ceux-ci lui sont indiqués, le cas échéant, avant paiement.',
      ],
    },
    {
      id: 'paiement',
      title: '6. Modalités et délais de paiement',
      paragraphs: [
        'Sauf conditions particulières figurant sur la facture, le règlement est dû à réception de la facture, par virement bancaire.',
        'Tout retard de paiement entraîne de plein droit des intérêts de retard, calculés sur la base du taux d’intérêt légal applicable, ' +
          'ainsi qu’une indemnité forfaitaire pour frais de recouvrement dont le montant est précisé sur la facture.',
        'Aucun escompte n’est accordé pour paiement anticipé.',
        'Lorsque le paiement intervient par l’intermédiaire d’une plateforme de distribution, les moyens de paiement acceptés et les ' +
          'conditions de remboursement sont ceux de cette plateforme.',
      ],
    },
    {
      id: 'livraison',
      title: '7. Livraison de la licence',
      paragraphs: [
        'La clé de licence au format RRV-… est adressée par courrier électronique à l’adresse indiquée par le Client, après encaissement du règlement.',
        'La clé est générée manuellement par l’Éditeur à partir de sa propre infrastructure ; elle n’est ni devinable ni liée à une vérification en ligne.',
        'La saisie de la clé dans le logiciel active le plan correspondant sur l’appareil du Client. Aucune connexion internet n’est requise pour cette activation.',
      ],
    },
    {
      id: 'licence',
      title: '8. Licence d’utilisation',
      paragraphs: [
        'L’Éditeur concède au Client un droit d’usage personnel, non exclusif, non transférable et non cessible du logiciel, pour la durée ' +
          'du plan souscrit et dans la limite du nombre de postes prévu.',
        'Le Client peut effectuer les copies de sauvegarde nécessaires à l’usage normal du logiciel.',
        `Le logiciel et les œuvres qui le composent sont protégés par la loi camerounaise n° 2000/011 du 19 décembre 2000 relative au droit ` +
          'd’auteur et aux droits voisins, ainsi que par l’Accord de Bangui révisé (Organisation africaine de la propriété intellectuelle), ' +
          'et par les conventions internationales applicables.',
        'Les actes d’interopérabilité autorisés par la loi applicable, notamment à des fins de décompilation pour assurer l’interopérabilité, ' +
          'restent permis dans les strictes limites qu’elle fixe.',
        'Le Client ne peut ni revendre, ni louer, ni sous-licencier la clé, ni l’utiliser au-delà du nombre de postes déclaré.',
      ],
    },
    {
      id: 'essai',
      title: '9. Essai gratuit',
      paragraphs: [
        'L’essai gratuit permet d’utiliser l’ensemble des fonctionnalités pendant quatorze jours à compter de la création de l’espace, ' +
          'sans carte bancaire et sans engagement.',
        'À l’issue de l’essai, l’accès aux fonctions demeure possible mais le plan n’est plus couvert : le Client régularise en saisissant ' +
          'une clé payante. Les données déjà saisies ne sont pas supprimées du fait de l’expiration de l’essai.',
      ],
    },
    {
      id: 'duree',
      title: '10. Durée et résiliation',
      paragraphs: [
        'La licence est souscrite pour la durée indiquée sur la facture. Sauf mention contraire, elle est conclue pour une durée d’un mois ' +
          'ou d’un an et n’est pas reconduite tacitement : la reconduction suppose une nouvelle commande.',
        'En cas de manquement grave du Client aux présentes conditions, l’Éditeur peut résilier la licence après mise en demeure restée sans ' +
          'effet pendant quinze jours. Les sommes dues au titre de la période en cours restent exigibles.',
        'La résiliation ne donne pas lieu à restitution des données détenues par le Client : celles-ci sont stockées sur son propre appareil ' +
          'et demeurent sous son contrôle exclusif.',
      ],
    },
    {
      id: 'retractation',
      title: '11. Rétractation — garantie commerciale de 14 jours',
      paragraphs: b2b
        ? [
            'Le droit de rétractation des consommateurs, tel que prévu par les droits nationaux qui l’instaurent (à titre d’exemple, en France, ' +
              'l’article L221-18 du Code de la consommation), est réservé aux personnes qui agissent à des fins non professionnelles. ' +
              'Les contrats conclus entre professionnels dans le cadre de leur activité n’ouvrent aucun droit de rétractation légal.',
            'Les présentes ventes étant réservées aux professionnels, aucune rétractation légale ne s’applique. Si un Client consommateur ' +
              'contractait néanmoins, il conserverait le bénéfice des dispositions impératives de son pays de résidence.',
            'Indépendamment de toute obligation légale, l’Éditeur accorde au Client une garantie commerciale d’annulation : toute commande peut ' +
              'être annulée par simple demande écrite dans les quatorze jours suivant sa date de facturation, pour quelque motif que ce soit.',
            'Cette garantie commerciale s’exerce sans pénalité. Elle emporte le remboursement intégral des sommes versées au titre de la période ' +
              'concernée et la désactivation de la clé de licence correspondante. Les données saisies par le Client dans son navigateur ne sont ' +
              'ni affectées ni supprimées par cette désactivation.',
            'Il s’agit d’un engagement volontaire de l’Éditeur, qui ne crée pas un droit de rétractation au sens d’une législation de protection ' +
              'des consommateurs. Ses modalités pratiques figurent sur la page dédiée.',
          ]
        : [
            'Lorsque le Client agit en qualité de consommateur, il dispose du droit de rétractation prévu par les dispositions impératives qui ' +
              'lui sont applicables, pendant le délai qu’elles fixent (quatorze jours en droit français, par exemple, à compter de la conclusion du contrat).',
            'Pour un contenu numérique fourni immédiatement, ce droit ne peut être écarté que dans les conditions prévues par ces mêmes ' +
              'dispositions, après accord exprès du consommateur et renoncement à son droit.',
            'Indépendamment de toute obligation légale, l’Éditeur accorde une garantie commerciale d’annulation de quatorze jours dans les mêmes ' +
              'termes que ci-dessus.',
          ],
      link: { label: 'Demander une annulation (14 jours)', path: '/retractation' },
    },
    {
      id: 'conformite',
      title: '12. Conformité et garanties',
      paragraphs: [
        'L’Éditeur délivre un logiciel conforme à la description qui en est faite et à sa documentation en ligne.',
        'Le Client professionnel bénéficie des garanties de droit commun qui lui sont applicables : délivrance conforme et garantie des vices ' +
          'cachés selon le droit applicable au contrat.',
        b2b
          ? 'Les garanties légales de conformité réservées aux consommateurs par les législations nationales ne s’appliquent pas aux relations ' +
            'entre professionnels, sauf disposition impérative contraire.'
          : 'Le Client consommateur bénéficie en outre des garanties légales de conformité prévues par les dispositions impératives qui lui sont applicables.',
        'Le Client reconnaît avoir vérifié que sa configuration technique (navigateur récent prenant en charge IndexedDB et Web Crypto) est ' +
          'compatible avant toute commande.',
      ],
    },
    {
      id: 'sauvegarde',
      title: '13. Sauvegarde des données — clause essentielle',
      paragraphs: [
        'Le Client est seul responsable de la sauvegarde de ses données. Le logiciel met à sa disposition un export de sauvegarde au format ' +
          'JSON ainsi qu’une procédure de restauration vérifiée.',
        'L’Éditeur ne dispose d’aucune copie des données du Client et ne peut donc procéder à aucune restauration, ni récupérer quelque donnée ' +
          'que ce soit en cas de perte de l’appareil, de suppression du profil de navigation, de réinitialisation du navigateur ou d’effacement ' +
          'des données locales par l’utilisateur ou par un tiers.',
        'Le Client reconnaît que cette absence de conservation à distance est une caractéristique substantielle du service, et qu’il lui ' +
          'appartient d’organiser une sauvegarde régulière, notamment avant toute opération de mise à jour du navigateur ou du système.',
      ],
    },
    {
      id: 'responsabilite',
      title: '14. Responsabilité',
      paragraphs: [
        'L’Éditeur est tenu à une obligation de moyens. Il ne garantit pas que le logiciel sera exempt de toute erreur ni que son usage ' +
          'produira un résultat financier déterminé.',
        'Les indicateurs fournis — balance âgée, score de risque, courbe de recouvrement prévisionnelle (CRF) — sont des outils d’aide à la ' +
          'décision fondés sur des règles internes explicites. Ils ne constituent ni une opinion comptable, ni une évaluation au sens d’un ' +
          'référentiel réglementaire, ni une provision au sens des normes IFRS 9 ou CECL.',
        'La responsabilité de l’Éditeur ne peut être engagée pour les décisions de gestion, de crédit ou de recouvrement prises par le Client ' +
          'sur la base des indicateurs du logiciel.',
        'Sauf faute lourde ou dommage corporel, la responsabilité totale de l’Éditeur au titre du contrat est plafonnée au montant effectivement ' +
          'payé par le Client au cours des douze mois précédant le fait générateur.',
      ],
    },
    {
      id: 'donnees-personnelles',
      title: '15. Données personnelles',
      paragraphs: [
        'Le Client demeure responsable des données personnelles qu’il enregistre dans le logiciel (coordonnées de ses propres clients). Il lui ' +
          'appartient de respecter les obligations qui lui incombent à ce titre, notamment l’information des personnes concernées.',
        'Les traitements réalisés par l’Éditeur en qualité de responsable de traitement sont décrits dans la politique de confidentialité.',
      ],
      link: { label: 'Politique de confidentialité', path: '/confidentialite' },
    },
    {
      id: 'force-majeure',
      title: '16. Force majeure',
      paragraphs: [
        'Aucune partie ne peut être tenue responsable d’un manquement résultant d’un événement de force majeure au sens du droit applicable ' +
          'au contrat. Les obligations sont suspendues pendant la durée de l’événement.',
      ],
    },
    {
      id: 'reclamations',
      title: '17. Réclamations et règlement des litiges',
      paragraphs: [
        `Toute réclamation doit être adressée par écrit à ${contactEmail(config)}. L’Éditeur s’engage à en accuser réception et à y répondre ` +
          'dans un délai de quinze jours ouvrés.',
        b2b
          ? 'La médiation de la consommation n’est pas applicable aux litiges entre professionnels : aucune médiation n’est proposée à ce titre ' +
            'et aucun médiateur de la consommation n’est désigné, cette désignation n’étant requise que pour les ventes aux consommateurs.'
          : 'Le Client consommateur peut recourir gratuitement à un médiateur de la consommation dans les conditions prévues par le droit qui ' +
            'lui est applicable. Le médiateur compétent sera désigné et communiqué avant toute vente à un consommateur.',
        'Les parties recherchent d’abord une solution amiable. À défaut, elles saisissent la juridiction compétente désignée à l’article 18.',
        'La plateforme européenne de règlement en ligne des litiges (RLL/ODR) a été fermée définitivement le 20 juillet 2025 : aucun lien vers ' +
          'ce service n’est donc proposé.',
      ],
    },
    {
      id: 'droit-applicable',
      title: '18. Droit applicable et juridiction',
      paragraphs: [
        `Les présentes conditions sont soumises au droit applicable au ${country.name}` +
          (country.legalSystem === 'ohada' ? ' et aux actes uniformes de l’OHADA' : '') + '.',
        'Les litiges avec un Client professionnel relèvent des juridictions compétentes du lieu d’établissement de l’Éditeur, sauf disposition ' +
          'impérative contraire.',
        'Les litiges avec un Client consommateur relèvent des règles de compétence qui lui sont applicables, notamment celles qui lui permettent ' +
          'de saisir la juridiction de son domicile.',
      ],
    },
    {
      id: 'divers',
      title: '19. Dispositions diverses',
      paragraphs: [
        'Si une clause des présentes conditions était déclarée nulle, les autres clauses conserveraient leur plein effet.',
        'L’Éditeur peut modifier les présentes conditions pour les commandes futures ; les conditions applicables sont celles en vigueur à la ' +
          'date de la commande.',
        'Le fait pour l’Éditeur de ne pas se prévaloir d’un manquement ne vaut pas renonciation à s’en prévaloir ultérieurement.',
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Politique de confidentialité — RGPD et droit camerounais            */
/* ------------------------------------------------------------------ */

export function buildPrivacyPolicy(config: EditorConfig = EDITOR_CONFIG): LegalSection[] {
  const country = editorCountry(config);
  const authority = country.dataProtectionAuthority;

  return [
    {
      id: 'responsable',
      title: '1. Responsable de traitement',
      paragraphs: [
        `Le responsable des traitements décrits ci-dessous est ${displayField(config.identity.legalName)}, ` +
          `${editorAddressLine(config)}.`,
        `Contact pour toute question relative aux données personnelles : ${contactEmail(config)}.`,
        'Ce responsable est une personne physique établie hors de l’Union européenne. Les conséquences de cette situation sont exposées à l’article 2.',
      ],
    },
    {
      id: 'champ-application',
      title: '2. Quel droit s’applique à ces traitements ?',
      paragraphs: [
        'Deux ensembles de règles peuvent s’appliquer, selon la personne concernée :',
      ],
      list: [
        `Droit camerounais : les traitements mis en œuvre depuis le ${country.name} relèvent du cadre national de protection des données ` +
          `(loi n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité, et textes d’application).`,
        'Règlement général sur la protection des données (RGPD) : il s’applique lorsqu’un responsable non établi dans l’Union européenne ' +
          'offre des biens ou services à des personnes qui s’y trouvent, ou suit leur comportement (article 3, paragraphe 2).',
        'Le site est édité en français et s’adresse en priorité à un public professionnel francophone, dont une partie se trouve dans l’Union ' +
          'européenne. Ce ciblage suffit à déclencher l’application du RGPD pour les personnes concernées qui s’y trouvent. L’éditeur ne s’en ' +
          'exonère donc pas.',
        'Lorsque le RGPD s’applique, la présente politique en reprend les exigences ; les références aux articles du RGPD doivent alors être lues ' +
          'comme telles. Lorsqu’il ne s’applique pas, les mêmes informations sont fournies à titre de transparence.',
      ],
    },
    {
      id: 'principe',
      title: '3. Principe directeur : vos données financières ne quittent pas votre appareil',
      paragraphs: [
        `${productName(config)} ne comporte aucun serveur applicatif. Les factures, paiements, engagements, litiges et relances que vous ` +
          'enregistrez sont stockés dans la base IndexedDB de votre navigateur. Ils ne sont transmis ni à l’Éditeur, ni à l’hébergeur, ni à un sous-traitant.',
        'L’Éditeur n’a donc aucun accès technique à ces données. Il ne peut ni les consulter, ni les exporter, ni les restaurer, ni les supprimer ' +
          'à distance. Cette absence d’accès est une garantie de confidentialité, mais implique que la sauvegarde relève de votre responsabilité.',
        'Le mot de passe de votre espace local n’est jamais transmis : il est transformé en empreinte (PBKDF2-SHA256, 120 000 itérations) et ' +
          'cette empreinte est stockée localement, dans votre navigateur.',
      ],
    },
    {
      id: 'traites',
      title: '4. Données effectivement traitées par l’Éditeur',
      paragraphs: ['Trois catégories de données seulement sont traitées côté Éditeur :'],
      list: [
        'Données de commande et de facturation : raison sociale, adresse, identifiant fiscal, nom et coordonnées du contact, historique des ' +
          'commandes et des paiements.',
        'Données de correspondance : messages que vous adressez au support, y compris l’adresse électronique utilisée.',
        'Journaux techniques de l’hébergeur : adresse IP, horodatage, pages demandées et agent utilisateur, conservés par l’hébergeur lors de ' +
          'chaque requête HTTP, pour la sécurité et le diagnostic d’incident.',
      ],
    },
    {
      id: 'finalites',
      title: '5. Finalités et bases légales',
      paragraphs: ['Chaque traitement repose sur une base légale distincte, conformément à l’article 6 du RGPD :'],
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
      title: '6. Durées de conservation',
      list: [
        'Dossier client et factures : dix ans à compter de la clôture de l’exercice, au titre des obligations comptables.',
        'Correspondance de support : trois ans à compter du dernier échange.',
        'Journaux techniques de l’hébergeur : durée fixée par l’hébergeur, de l’ordre de quelques jours à quelques semaines selon le service.',
        'Prospect n’ayant pas donné suite : trois ans à compter du dernier contact.',
      ],
    },
    {
      id: 'destinataires',
      title: '7. Destinataires et sous-traitants',
      paragraphs: [
        'Les données ne sont ni vendues, ni louées, ni cédées à des fins publicitaires. Elles sont accessibles au seul éditeur et aux ' +
          'prestataires strictement nécessaires :',
      ],
      list: [
        `Hébergement du site : ${HOST.name}, ${HOST.address}.`,
        'Messagerie électronique : le prestataire utilisé pour l’envoi des clés de licence et des factures.',
        'Comptabilité : l’expert-comptable ou le service de comptabilité de l’Éditeur, soumis au secret professionnel.',
        ...(config.channels.length > 0
          ? [
              `Distribution : ${config.channels.map(channel => channel.name).join(', ')}. Ces plateformes traitent les données de commande et ` +
                'de paiement pour le compte de leur propre responsable de traitement ou pour celui de l’éditeur — cette qualification reste à ' +
                'établir, et sera répercutée dans la présente politique.',
            ]
          : []),
      ],
    },
    {
      id: 'transferts',
      title: '8. Transferts hors Union européenne',
      paragraphs: [
        'L’hébergement du site est assuré par un prestataire établi aux États-Unis. Les requêtes vers le site (adresse IP, agent utilisateur, ' +
          'horodatage) peuvent donc transiter par un réseau de diffusion international.',
        'Aucune donnée de gestion de créances n’est concernée par ces transferts, puisqu’elle ne quitte jamais votre navigateur.',
        'Les transferts éventuels de données de facturation reposent sur les clauses contractuelles types de la Commission européenne et, le ' +
          'cas échéant, sur le cadre de protection des données UE–États-Unis.',
      ],
    },
    {
      id: 'representant',
      title: '9. Représentant dans l’Union européenne',
      paragraphs: [
        'Lorsqu’un responsable de traitement n’est pas établi dans l’Union européenne mais que le RGPD s’applique à lui, l’article 27 impose en ' +
          'principe la désignation d’un représentant dans l’Union, sauf exemption (traitement occasionnel, ne portant pas sur des catégories ' +
          'particulières de données, et ne créant pas de risque élevé).',
        'À la date de révision de ce document, aucun représentant n’est encore désigné. Cette désignation fait partie des points identifiés comme ' +
          'à traiter avant toute commercialisation à destination de clients établis dans l’Union européenne.',
        'La présente politique sera mise à jour avec les coordonnées du représentant dès sa désignation.',
      ],
    },
    {
      id: 'droits',
      title: '10. Vos droits',
      paragraphs: [
        'Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité prévus aux articles 15 ' +
          'à 20 du RGPD, ainsi que du droit de retirer votre consentement lorsqu’un traitement repose sur celui-ci.',
        `Pour exercer ces droits, écrivez à ${contactEmail(config)}. Une réponse est apportée dans un délai d’un mois, pouvant être prolongé de ` +
          'deux mois pour les demandes complexes.',
        'Les données enregistrées dans votre navigateur peuvent être supprimées directement par vous : l’application met à disposition un export ' +
          'de sauvegarde et la suppression de l’espace local. L’Éditeur n’ayant aucun accès à ces données, il ne peut ni les fournir, ni les ' +
          'effacer à votre place.',
      ],
    },
    {
      id: 'reclamation',
      title: '11. Réclamation auprès d’une autorité de contrôle',
      paragraphs: [
        'Si vous résidez dans l’Union européenne, vous pouvez introduire une réclamation auprès de l’autorité de contrôle de votre État membre ' +
          'de résidence. En France, il s’agit de la Commission nationale de l’informatique et des libertés (CNIL), 3 place de Fontenoy, ' +
          'TSA 80715, 75334 Paris Cedex 07, ou en ligne sur cnil.fr.',
        authority
          ? `Au ${country.name}, l’autorité compétente est : ${authority.name}${authority.website ? ` (${authority.website})` : ''}.`
          : `Au ${country.name}, aucune autorité de contrôle équivalente à la CNIL n’est identifiée à ce jour. Le cadre national (loi n° 2010/012 ` +
            'du 21 décembre 2010) ne prévoit pas, en l’état des informations disponibles, de voie de recours administrative équivalente. Ce point ' +
            'doit être vérifié auprès d’un juriste camerounais.',
        'L’exercice d’une réclamation n’exclut pas la recherche préalable d’une solution amiable avec l’éditeur.',
      ],
    },
    {
      id: 'cookies',
      title: '12. Cookies et traceurs',
      paragraphs: [
        'Le site ne dépose aucun cookie publicitaire, aucun cookie de mesure d’audience tiers et aucun traceur de réseaux sociaux.',
        'Le stockage local (IndexedDB) sert exclusivement au fonctionnement de l’application : espace de travail, organisation, jetons de session ' +
          'locaux. Il constitue un stockage strictement nécessaire et ne requiert donc pas de consentement préalable.',
        'Aucun consentement n’étant requis, aucun bandeau de cookies n’est affiché — et son absence n’est pas un manquement.',
      ],
    },
    {
      id: 'securite',
      title: '13. Sécurité',
      paragraphs: [
        'Les échanges avec le site sont chiffrés en transit (HTTPS avec HSTS). Le site est servi en fichiers statiques, sans base de données ' +
          'exposée et sans interface d’administration distante : la surface d’attaque est volontairement réduite.',
        'Les mots de passe locaux ne sont jamais stockés en clair : seule une empreinte dérivée (PBKDF2-SHA256, sel aléatoire, 120 000 itérations) ' +
          'est conservée dans votre navigateur.',
        'En cas de violation de données susceptible d’engendrer un risque élevé pour vos droits, vous seriez informé dans les conditions de ' +
          'l’article 34 du RGPD.',
      ],
    },
    {
      id: 'mineurs',
      title: '14. Mineurs',
      paragraphs: [
        'Le service est destiné à des professionnels et n’est pas conçu pour être utilisé par des mineurs. Aucune donnée de mineur n’est ' +
          'sciemment collectée par l’Éditeur.',
      ],
    },
    {
      id: 'modification',
      title: '15. Modification de la présente politique',
      paragraphs: [
        'Cette politique peut être mise à jour pour tenir compte d’une évolution légale ou d’une modification du service. La date de dernière ' +
          'révision figure en tête du document.',
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Rétractation                                                        */
/* ------------------------------------------------------------------ */

export function buildWithdrawalPolicy(config: EditorConfig = EDITOR_CONFIG): LegalSection[] {
  const product = productName(config);

  return [
    {
      id: 'principe',
      title: '1. Ventes entre professionnels : pas de droit de rétractation légal',
      paragraphs: [
        'Le droit de rétractation est un mécanisme de protection des consommateurs. Il est prévu par les législations nationales qui l’instaurent — ' +
          'à titre d’exemple, en France, l’article L221-18 du Code de la consommation — et bénéficie aux personnes qui agissent à des fins n’entrant ' +
          'pas dans le cadre de leur activité professionnelle.',
        `${product} est commercialisé auprès de professionnels. Les contrats conclus dans ce cadre n’ouvrent donc aucun droit de rétractation légal, ` +
          'et aucun délai de rétractation ne court.',
        'Cette exclusion n’est pas une clause imposée au Client : elle résulte de la nature même du contrat, conclu entre deux professionnels dans ' +
          'le cadre de leur activité.',
      ],
    },
    {
      id: 'garantie',
      title: '2. Garantie commerciale d’annulation de 14 jours',
      paragraphs: [
        'Indépendamment de toute obligation légale, l’Éditeur accorde une garantie commerciale d’annulation : toute commande peut être annulée par ' +
          'simple demande écrite dans les quatorze jours suivant sa date de facturation, sans avoir à se justifier et sans pénalité.',
        'Cette garantie est plus favorable que le droit commun applicable aux ventes entre professionnels. Elle ne constitue pas un droit de ' +
          'rétractation au sens d’une législation de protection des consommateurs et ne peut être invoquée comme telle.',
        'Elle s’applique à la première commande comme aux renouvellements, y compris lorsque la clé de licence a déjà été communiquée.',
      ],
    },
    {
      id: 'exercice',
      title: '3. Comment demander l’annulation',
      paragraphs: [
        'Le bouton ci-dessous ouvre un message déjà rédigé, adressé à l’éditeur. Envoyez-le : votre demande est horodatée par votre messagerie, ' +
          'ce qui constitue une preuve d’envoi.',
        'Toute autre forme écrite produit le même effet : courriel direct, courrier, ou le formulaire type reproduit plus bas.',
        'La demande doit permettre d’identifier la commande : date de facture, offre souscrite et, si possible, la clé de licence concernée.',
      ],
    },
    {
      id: 'formulaire',
      title: '4. Formulaire type',
      paragraphs: [
        'À l’attention de l’éditeur, dont les coordonnées figurent dans les mentions légales :',
        `« Je vous notifie l’annulation de ma commande portant sur le service suivant : ${product} — [offre souscrite]. Facturée le [date]. ` +
          'Organisation : [raison sociale]. Contact : [nom]. Clé de licence : [clé]. Date : [date]. »',
      ],
    },
    {
      id: 'effets',
      title: '5. Effets de l’annulation',
      paragraphs: [
        'Le remboursement des sommes versées au titre de la période concernée intervient au plus tard quatorze jours à compter de la réception de ' +
          'la demande, par le même moyen de paiement que celui utilisé lors du règlement, ou par virement si le paiement initial a été effectué par ' +
          'ce canal.',
        'La clé de licence associée est désactivée : elle cesse d’être valable et ne doit plus être utilisée.',
        'Les données enregistrées dans le navigateur du Client ne sont ni consultées, ni modifiées, ni supprimées par cette désactivation : ' +
          'l’Éditeur n’y a aucun accès.',
      ],
    },
    {
      id: 'litiges',
      title: '6. En cas de désaccord',
      paragraphs: [
        `Si la réponse apportée ne vous satisfait pas, adressez une réclamation écrite à ${contactEmail(config)}. L’Éditeur répond dans un délai de ` +
          'quinze jours ouvrés.',
        'Les litiges entre professionnels sont examinés en priorité par voie amiable, puis portés devant la juridiction compétente désignée à ' +
          'l’article 18 des conditions générales de vente.',
        'La médiation de la consommation ne s’applique pas aux relations entre professionnels.',
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Documents par défaut (configuration active)                         */
/* ------------------------------------------------------------------ */

export const LEGAL_NOTICE_SECTIONS: LegalSection[] = buildLegalNotice(EDITOR_CONFIG);
export const CONDITIONS_OF_USE_SECTIONS: LegalSection[] = buildTermsOfUse(EDITOR_CONFIG);
export const TERMS_SECTIONS: LegalSection[] = buildTermsOfSale(EDITOR_CONFIG);
export const PRIVACY_SECTIONS: LegalSection[] = buildPrivacyPolicy(EDITOR_CONFIG);
export const WITHDRAWAL_SECTIONS: LegalSection[] = buildWithdrawalPolicy(EDITOR_CONFIG);

/** Alias local de l'identifiant de document défini par la configuration. */
export type LegalDocumentId = DocumentId;

export const ALL_LEGAL_DOCUMENTS: ReadonlyArray<{
  id: LegalDocumentId;
  path: string;
  title: string;
  sections: LegalSection[];
}> = [
  { id: 'mentions-legales', path: '/mentions-legales', title: 'Mentions légales', sections: LEGAL_NOTICE_SECTIONS },
  { id: 'cgu', path: '/cgu', title: 'Conditions générales d’utilisation', sections: CONDITIONS_OF_USE_SECTIONS },
  { id: 'cgv', path: '/cgv', title: 'Conditions générales de vente', sections: TERMS_SECTIONS },
  { id: 'confidentialite', path: '/confidentialite', title: 'Politique de confidentialité', sections: PRIVACY_SECTIONS },
  { id: 'retractation', path: '/retractation', title: 'Rétractation et garantie commerciale', sections: WITHDRAWAL_SECTIONS },
];

/** Texte intégral d'un document, pour la recherche et les tests. */
export function documentText(sections: readonly LegalSection[]): string {
  return sections
    .map(s => [s.title, ...(s.paragraphs ?? []), ...(s.list ?? [])].join('\n'))
    .join('\n\n');
}

/**
 * État de validation d'un document, exposé pour l'interface d'administration.
 * Délégué à `validateDocument` : la même règle sert au bandeau public, à la
 * console de conformité et au script `npm run legal:check`.
 */
export function documentStatus(documentId: LegalDocumentId, config: EditorConfig = EDITOR_CONFIG) {
  return validateDocument(config, documentId);
}
