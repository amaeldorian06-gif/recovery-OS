/**
 * Identité légale de l'éditeur — source unique de vérité.
 *
 * Principe : aucune donnée n'est inventée. Chaque valeur porte un ÉTAT explicite
 * parmi quatre, ce qui permet de distinguer « renseigné », « sans objet dans ce
 * pays / pour ce type d'éditeur », « manquant » et « à faire valider par un
 * juriste ». Les documents publics n'affichent jamais une valeur absente comme
 * si elle existait.
 *
 * Configuration actuelle : personne physique établie au Cameroun, activité
 * exercée en nom personnel, sans société constituée.
 *
 * ⚠️ Ce fichier n'est pas un formulaire : il est compilé avec l'application.
 * Toute modification nécessite un nouveau build. La console `/conformite`
 * permet de visualiser l'état et de générer le bloc de configuration à coller ici.
 */

import { getJurisdiction, Jurisdiction } from './jurisdictions';
import { SALES_CHANNELS, SalesChannel, unverifiedChannels } from './channels';

/* ------------------------------------------------------------------ */
/* 1. États de donnée                                                  */
/* ------------------------------------------------------------------ */

/**
 * - `provided`              : valeur renseignée et assumée.
 * - `not_applicable`        : le champ n'a pas d'objet (ex. capital social d'une
 *                             personne physique). N'empêche jamais la publication.
 * - `to_complete`           : valeur juridiquement nécessaire mais absente.
 *                             BLOQUE la publication du document concerné.
 * - `legal_review_required` : une valeur existe ou une question se pose, mais
 *                             elle doit être validée par un professionnel du droit.
 *                             BLOQUE aussi la publication : on ne publie pas un
 *                             document dont une mention n'est pas tranchée.
 */
export type FieldState = 'provided' | 'not_applicable' | 'to_complete' | 'legal_review_required';

export interface LegalField {
  state: FieldState;
  value: string | null;
  /** Justification interne : pourquoi le champ est sans objet, ou quelle question reste ouverte. */
  note?: string;
  /** Référence juridique à l'appui de l'état. */
  basis?: string;
}

export const provided = (value: string, basis?: string): LegalField => ({
  state: 'provided',
  value: value.trim(),
  basis,
});

export const toComplete = (label: string, basis?: string): LegalField => ({
  state: 'to_complete',
  value: null,
  note: `À renseigner : ${label}`,
  basis,
});

export const notApplicable = (reason: string, basis?: string): LegalField => ({
  state: 'not_applicable',
  value: null,
  note: reason,
  basis,
});

export const legalReview = (question: string, options: { value?: string; basis?: string } = {}): LegalField => ({
  state: 'legal_review_required',
  value: options.value ?? null,
  note: question,
  basis: options.basis,
});

export const FIELD_STATE_LABELS: Record<FieldState, string> = {
  provided: 'Renseigné',
  not_applicable: 'Non applicable',
  to_complete: 'À compléter',
  legal_review_required: 'À vérifier juridiquement',
};

/** Vrai si le champ contient une valeur exploitable dans un document. */
export function hasValue(field: LegalField): boolean {
  return field.state === 'provided' && typeof field.value === 'string' && field.value.length > 0;
}

/** Vrai si l'absence de valeur bloque la publication. */
export function isBlocking(field: LegalField): boolean {
  return field.state === 'to_complete' || (field.state === 'provided' && !hasValue(field));
}

/** Vrai si le champ exige une validation juridique. */
export function needsLegalReview(field: LegalField): boolean {
  return field.state === 'legal_review_required';
}

/**
 * Rendu d'un champ dans un document public.
 * Une valeur absente n'est jamais remplacée par une donnée plausible : elle est
 * signalée visiblement, ce qui empêche de publier un document trompeur.
 */
export function displayField(field: LegalField): string {
  switch (field.state) {
    case 'provided':
      return field.value && field.value.length > 0 ? field.value : '[non renseigné]';
    case 'not_applicable':
      return 'sans objet';
    case 'legal_review_required':
      return field.value ? `${field.value} [à confirmer]` : '[à vérifier juridiquement]';
    case 'to_complete':
    default:
      return '[à compléter]';
  }
}

/* ------------------------------------------------------------------ */
/* 2. Types d'éditeur                                                  */
/* ------------------------------------------------------------------ */

/**
 * - `individual`    : personne physique exerçant en nom personnel.
 * - `self_employed` : entrepreneur individuel disposant d'un statut propre
 *                     (en OHADA : l'entreprenant, AUDCG art. 30).
 * - `company`       : personne morale immatriculée.
 */
export type EditorType = 'individual' | 'company' | 'self_employed';

export const EDITOR_TYPE_LABELS: Record<EditorType, string> = {
  individual: 'Personne physique (nom personnel)',
  self_employed: 'Entrepreneur individuel (statut déclaré)',
  company: 'Société immatriculée',
};

/** Clientèle visée. Décide des obligations applicables (médiation, rétractation). */
export type SalesScope = 'b2b' | 'b2c';

/* ------------------------------------------------------------------ */
/* 3. Structure de configuration                                       */
/* ------------------------------------------------------------------ */

export interface EditorIdentity {
  legalName: LegalField;
  /** Nom commercial du produit ou de la marque, distinct du nom légal. */
  tradeName: LegalField;
  address: LegalField;
  postalCode: LegalField;
  city: LegalField;
  phone: LegalField;
  email: LegalField;
}

export interface EditorRegistration {
  /** Numéro d'immatriculation ou de déclaration d'activité, selon le pays. */
  identifier: LegalField;
  /** Libellé local exact du numéro (RCCM, SIREN, NIU…). */
  identifierLabel: string;
  identifierCountry: LegalField;
  taxNumber: LegalField;
  /** Capital social : ne concerne que les personnes morales. */
  capital: LegalField;
  /** Greffe / RCS français : ne concerne que les éditeurs immatriculés en France. */
  domesticRegistry: LegalField;
}

export interface EditorialResponsibility {
  /** Pour une personne physique, le directeur de publication est l'éditeur lui-même. */
  directorIsEditor: boolean;
  directorName: LegalField;
  directorContact: LegalField;
}

export interface RightsOwnership {
  holderIsEditor: boolean;
  holderName: LegalField;
  holderNote: LegalField;
}

export type TaxRegime = 'no_french_vat' | 'french_franchise' | 'vat_registered' | 'to_verify';

export interface TaxConfig {
  regime: TaxRegime;
  note: string;
}

export interface EditorConfig {
  type: EditorType;
  countryCode: string;
  identity: EditorIdentity;
  registration: EditorRegistration;
  publication: EditorialResponsibility;
  rights: RightsOwnership;
  tax: TaxConfig;
  salesScope: SalesScope;
  channels: SalesChannel[];
}

/* ------------------------------------------------------------------ */
/* 4. Configuration active                                             */
/* ------------------------------------------------------------------ */

/** Pays d'établissement de l'éditeur. */
export const EDITOR_COUNTRY_CODE = 'CM';

const country: Jurisdiction = getJurisdiction(EDITOR_COUNTRY_CODE);

export const EDITOR_CONFIG: EditorConfig = {
  type: 'individual',
  countryCode: EDITOR_COUNTRY_CODE,

  identity: {
    legalName: toComplete(
      'nom et prénoms de l’éditeur (état civil complet)',
      'LCEN art. 1-1 : identité de l’éditeur d’un service de communication au public en ligne.'
    ),
    tradeName: provided('Revenue Recovery OS', 'Nom commercial du produit, distinct du nom légal de l’éditeur.'),
    address: toComplete('adresse professionnelle (quartier, rue, boîte postale le cas échéant)'),
    // Le Cameroun n'utilise pas de code postal généralisé : le champ est sans objet
    // et ne doit donc pas bloquer la publication.
    postalCode: notApplicable(
      country.postalCodeNote ?? 'Aucun code postal n’est utilisé dans ce pays.',
      'Aucune obligation d’affichage d’un code postal lorsque le pays n’en attribue pas.'
    ),
    city: toComplete('ville du principal établissement'),
    phone: toComplete('numéro de téléphone professionnel joignable'),
    email: toComplete('adresse e-mail de contact (adresse réelle, relevée)'),
  },

  registration: {
    identifier: toComplete(
      'numéro de déclaration d’activité (entreprenant) ou numéro RCCM',
      'OHADA, AUDCG art. 30 : une personne physique exerçant une activité commerciale doit être immatriculée au RCCM ou avoir déclaré son activité.'
    ),
    identifierLabel: 'Numéro de déclaration d’activité (RCCM)',
    identifierCountry: provided(country.name),
    taxNumber: toComplete(`numéro fiscal — ${country.taxIdentifierLabel ?? 'identifiant fiscal'}`),
    capital: notApplicable(
      'Une personne physique n’a pas de capital social : ce champ ne concerne que les sociétés.',
      'Aucun texte n’impose l’affichage d’un capital social à un entrepreneur personne physique.'
    ),
    domesticRegistry: notApplicable(
      'L’éditeur n’est pas immatriculé en France : ni greffe ni numéro RCS français.',
      'LCEN art. 1-1 : les mentions de registre ne concernent que les personnes qui y sont immatriculées.'
    ),
  },

  publication: {
    directorIsEditor: true,
    directorName: notApplicable(
      'Le directeur de la publication est l’éditeur lui-même, personne physique : la valeur est reprise de l’identité.',
      'LCEN art. 1-1 II : pour une personne physique, le directeur de la publication est l’éditeur.'
    ),
    directorContact: notApplicable(
      'Le contact de la direction de la publication est l’adresse e-mail de l’éditeur.',
      'Aucune obligation d’un contact distinct pour une personne physique.'
    ),
  },

  rights: {
    holderIsEditor: true,
    holderName: notApplicable(
      'Les droits sont détenus par l’éditeur : aucun cessionnaire ni titulaire distinct n’est identifié.',
    ),
    holderNote: provided(
      'Le code source est distribué sous licence Apache 2.0 ; la licence ne confère aucun droit sur la marque ni sur les contenus rédactionnels.'
    ),
  },

  tax: {
    regime: 'no_french_vat',
    note:
      'L’éditeur n’est pas établi en France et ne dispose donc d’aucun numéro de TVA français. ' +
      'Les prix sont exprimés hors taxe. Pour une prestation B2B fournie à un client professionnel ' +
      'établi dans l’Union européenne, l’autoliquidation par le client (régime du « reverse charge ») ' +
      'est en principe applicable : ce point doit être confirmé avec un conseil fiscal.',
  },

  salesScope: 'b2b',
  channels: SALES_CHANNELS,
};

/* ------------------------------------------------------------------ */
/* 5. Résolution des champs dérivés                                    */
/* ------------------------------------------------------------------ */

/**
 * Directeur de la publication : confondu avec l'éditeur pour une personne
 * physique, saisi séparément pour une société.
 */
export function resolvedPublicationDirector(config: EditorConfig = EDITOR_CONFIG): LegalField {
  if (config.type !== 'company' || config.publication.directorIsEditor) {
    return config.identity.legalName;
  }
  return config.publication.directorName;
}

/** Titulaire des droits sur le logiciel. */
export function resolvedRightsHolder(config: EditorConfig = EDITOR_CONFIG): LegalField {
  return config.rights.holderIsEditor ? config.identity.legalName : config.rights.holderName;
}

const CONTACT_FALLBACK = 'contact@recovery-os.example';

/**
 * Adresse e-mail de contact.
 * Le repli est un domaine réservé par la RFC 2606 : il ne peut jamais recevoir
 * de courrier, ce qui rend l'oubli visible plutôt que silencieux.
 */
export function contactEmail(config: EditorConfig = EDITOR_CONFIG): string {
  return hasValue(config.identity.email) ? (config.identity.email.value as string) : CONTACT_FALLBACK;
}

export function isContactFallback(config: EditorConfig = EDITOR_CONFIG): boolean {
  return !hasValue(config.identity.email);
}

/** Adresse complète sur une ligne, sans code postal lorsque celui-ci est sans objet. */
export function editorAddressLine(config: EditorConfig = EDITOR_CONFIG): string {
  const parts = [
    displayField(config.identity.address),
    config.identity.postalCode.state === 'not_applicable'
      ? null
      : displayField(config.identity.postalCode),
    displayField(config.identity.city),
    country.name,
  ].filter((part): part is string => part !== null && part.length > 0);
  return parts.join(', ');
}

/** Pays d'établissement de la configuration. */
export function editorCountry(config: EditorConfig = EDITOR_CONFIG): Jurisdiction {
  return getJurisdiction(config.countryCode);
}

/** Mention légale locale obligatoire (ex. « Entreprenant dispensé d'immatriculation »). */
export function localRequiredMention(config: EditorConfig = EDITOR_CONFIG): string | null {
  const registry = config.type === 'company'
    ? editorCountry(config).companyRegistry
    : editorCountry(config).individualRegistry;
  return registry?.requiredMention ?? null;
}

/** Vrai si la configuration décrit une personne morale. */
export function isCompany(config: EditorConfig = EDITOR_CONFIG): boolean {
  return config.type === 'company';
}

/* ------------------------------------------------------------------ */
/* 6. Validation conditionnelle                                        */
/* ------------------------------------------------------------------ */

export type DocumentId = 'mentions-legales' | 'cgu' | 'cgv' | 'confidentialite' | 'retractation';

export type DocumentStatus = 'complete' | 'incomplete' | 'legal_review_required';

export interface FieldIssue {
  key: string;
  label: string;
  field: LegalField;
}

export interface DocumentValidation {
  id: DocumentId;
  title: string;
  path: string;
  status: DocumentStatus;
  missing: FieldIssue[];
  review: FieldIssue[];
  /** Points de vérification juridique qui ne portent pas sur un champ unique. */
  reviewNotes: string[];
}

export interface ValidationSummary {
  status: DocumentStatus;
  /**
   * Vrai si aucun champ obligatoire ne manque.
   * ⚠️ Condition TECHNIQUE, pas juridique : un document structurellement
   * complet n'est pas pour autant réputé conforme. Voir `legalReviewRequired`.
   */
  structurallyComplete: boolean;
  /** Vrai si au moins un point doit être tranché par un professionnel du droit. */
  legalReviewRequired: boolean;
  documents: DocumentValidation[];
  missingFields: FieldIssue[];
  reviewFields: FieldIssue[];
  reviewNotes: string[];
}

export const PRODUCT = 'Revenue Recovery OS';

export const LEGAL_UPDATED_AT = '2026-11-04';

const DOCUMENT_TITLES: Record<DocumentId, { title: string; path: string }> = {
  'mentions-legales': { title: 'Mentions légales', path: '/mentions-legales' },
  cgu: { title: 'Conditions générales d’utilisation', path: '/cgu' },
  cgv: { title: 'Conditions générales de vente', path: '/cgv' },
  confidentialite: { title: 'Politique de confidentialité', path: '/confidentialite' },
  retractation: { title: 'Rétractation et garantie commerciale', path: '/retractation' },
};

type NamedField = [key: string, label: string, field: LegalField];

/** Champs communs à tout document public identifiant l'éditeur. */
function identityFields(config: EditorConfig): NamedField[] {
  return [
    ['identity.legalName', 'Nom légal de l’éditeur', config.identity.legalName],
    ['identity.address', 'Adresse professionnelle', config.identity.address],
    ['identity.city', 'Ville', config.identity.city],
    ['identity.email', 'Adresse e-mail de contact', config.identity.email],
  ];
}

/** Champs propres au document demandé. */
function requiredFields(config: EditorConfig, documentId: DocumentId): NamedField[] {
  const base = identityFields(config);

  switch (documentId) {
    case 'mentions-legales':
      return [
        ...base,
        ['identity.phone', 'Téléphone', config.identity.phone],
        ['registration.identifier', config.registration.identifierLabel, config.registration.identifier],
      ];
    case 'cgu':
      return [...base, ['rights.holder', 'Titulaire des droits', resolvedRightsHolder(config)]];
    case 'cgv':
      return [
        ...base,
        ['registration.identifier', config.registration.identifierLabel, config.registration.identifier],
        ...(isCompany(config)
          ? ([['registration.capital', 'Capital social', config.registration.capital]] as NamedField[])
          : []),
      ];
    case 'confidentialite':
      return base;
    case 'retractation':
      return [base[0], base[3]];
    default:
      return base;
  }
}

/** Points de vigilance juridique transverses, rattachés au document concerné. */
function reviewNotes(config: EditorConfig, documentId: DocumentId): string[] {
  const notes: string[] = [];

  const unverified = unverifiedChannels(config.channels);
  if (unverified.length > 0 && (documentId === 'mentions-legales' || documentId === 'cgv' || documentId === 'cgu')) {
    notes.push(
      `Rôle contractuel de ${unverified.map(c => c.name).join(' et ')} non établi : ` +
      `revendeur, mandataire, prestataire de paiement ou merchant of record ? ` +
      `La qualification détermine qui est le vendeur au sens contractuel et qui émet la facture. ` +
      `À trancher à partir de leurs conditions générales avant publication.`
    );
  }

  if (config.tax.regime === 'no_french_vat' && (documentId === 'cgv')) {
    notes.push(
      'Traitement de la TVA sur les ventes B2B vers l’Union européenne non validé par un conseil fiscal ' +
      '(autoliquidation par le client le cas échéant).'
    );
  }

  if (config.tax.regime === 'to_verify' && documentId === 'cgv') {
    notes.push('Régime de taxe non déterminé.');
  }

  if (documentId === 'confidentialite' && config.countryCode !== 'FR' && config.countryCode !== 'BE') {
    notes.push(
      'Représentant dans l’Union au sens de l’article 27 du RGPD : un responsable de traitement non établi ' +
      'dans l’Union qui cible des personnes qui s’y trouvent doit en principe en désigner un, sauf exemption ' +
      '(traitement occasionnel, pas de données sensibles, risque faible). À vérifier.'
    );
    notes.push(
      'Autorité de contrôle compétente pour les personnes situées dans l’Union : à déterminer selon les cas ' +
      '(autorité de l’État membre de résidence de la personne concernée). Le droit camerounais ne prévoit pas ' +
      'd’autorité équivalente identifiée.'
    );
  }

  if (documentId === 'cgv' || documentId === 'cgu') {
    notes.push(
      'Articulation entre le droit camerounais et OHADA (droit de l’éditeur) et les dispositions impératives ' +
      'éventuelles du pays du client professionnel : à valider par un juriste.'
    );
  }

  if (config.type === 'individual' && documentId === 'mentions-legales') {
    notes.push(
      'Exercice en nom personnel sans immatriculation : vérifier si l’activité relève de plein droit du ' +
      'statut de commerçant ou de l’entreprenant (OHADA, AUDCG art. 30). Le numéro de déclaration devient ' +
      'alors obligatoire sur les documents professionnels.'
    );
  }

  return notes;
}

export function validateDocument(config: EditorConfig, documentId: DocumentId): DocumentValidation {
  const fields = requiredFields(config, documentId);
  const missing = fields
    .filter(([, , field]) => isBlocking(field))
    .map(([key, label, field]) => ({ key, label, field }));

  const review = fields
    .filter(([, , field]) => needsLegalReview(field))
    .map(([key, label, field]) => ({ key, label, field }));

  const notes = reviewNotes(config, documentId);

  const status: DocumentStatus = missing.length > 0
    ? 'incomplete'
    : review.length > 0 || notes.length > 0
      ? 'legal_review_required'
      : 'complete';

  return {
    id: documentId,
    title: DOCUMENT_TITLES[documentId].title,
    path: DOCUMENT_TITLES[documentId].path,
    status,
    missing,
    review,
    reviewNotes: notes,
  };
}

/** État de chacun des documents, plus le résumé global. */
export function validationSummary(config: EditorConfig = EDITOR_CONFIG): ValidationSummary {
  const ids: DocumentId[] = ['mentions-legales', 'cgu', 'cgv', 'confidentialite', 'retractation'];
  const documents = ids.map(id => validateDocument(config, id));

  const missingFields: FieldIssue[] = [];
  const reviewFields: FieldIssue[] = [];
  const reviewNotes: string[] = [];

  for (const doc of documents) {
    for (const issue of doc.missing) {
      if (!missingFields.some(existing => existing.key === issue.key)) missingFields.push(issue);
    }
    for (const issue of doc.review) {
      if (!reviewFields.some(existing => existing.key === issue.key)) reviewFields.push(issue);
    }
    for (const note of doc.reviewNotes) {
      if (!reviewNotes.includes(note)) reviewNotes.push(note);
    }
  }

  const status: DocumentStatus = missingFields.length > 0
    ? 'incomplete'
    : reviewFields.length > 0 || reviewNotes.length > 0
      ? 'legal_review_required'
      : 'complete';

  return {
    status,
    structurallyComplete: missingFields.length === 0,
    legalReviewRequired: reviewFields.length > 0 || reviewNotes.length > 0,
    documents,
    missingFields,
    reviewFields,
    reviewNotes,
  };
}

/** Compatibilité : liste des libellés de champs manquants. */
export function missingLegalFields(config: EditorConfig = EDITOR_CONFIG): string[] {
  return validationSummary(config).missingFields.map(issue => issue.label);
}

/** Vrai tant que l'identité légale n'est pas exploitable. */
export function isLegalIdentityIncomplete(config: EditorConfig = EDITOR_CONFIG): boolean {
  return missingLegalFields(config).length > 0;
}

/* ------------------------------------------------------------------ */
/* 7. Sérialisation (générateur de configuration)                      */
/* ------------------------------------------------------------------ */

const quote = (value: string | null): string => (value === null ? 'null' : JSON.stringify(value));

function literal(field: LegalField): string {
  const args: string[] = [];
  if (field.state === 'provided') args.push(quote(field.value));
  else if (field.state === 'not_applicable') args.push(quote(field.note ?? 'Sans objet'));
  else if (field.state === 'to_complete') args.push(quote(field.note?.replace(/^À renseigner : /, '') ?? ''));
  else args.push(quote(field.note ?? 'À vérifier'));
  return `${field.state}(${args.join(', ')})`;
}

/**
 * Produit le littéral TypeScript de la configuration, destiné à être collé dans
 * ce fichier. Permet à la console de conformité de générer un bloc valide sans
 * jamais prétendre modifier le site déployé en direct.
 */
export function toConfigLiteral(config: EditorConfig = EDITOR_CONFIG): string {
  const field = literal;
  return `{
  type: '${config.type}',
  countryCode: '${config.countryCode}',
  identity: {
    legalName: ${field(config.identity.legalName)},
    tradeName: ${field(config.identity.tradeName)},
    address: ${field(config.identity.address)},
    postalCode: ${field(config.identity.postalCode)},
    city: ${field(config.identity.city)},
    phone: ${field(config.identity.phone)},
    email: ${field(config.identity.email)},
  },
  registration: {
    identifier: ${field(config.registration.identifier)},
    identifierLabel: ${quote(config.registration.identifierLabel)},
    identifierCountry: ${field(config.registration.identifierCountry)},
    taxNumber: ${field(config.registration.taxNumber)},
    capital: ${field(config.registration.capital)},
    domesticRegistry: ${field(config.registration.domesticRegistry)},
  },
  publication: {
    directorIsEditor: ${config.publication.directorIsEditor},
    directorName: ${field(config.publication.directorName)},
    directorContact: ${field(config.publication.directorContact)},
  },
  rights: {
    holderIsEditor: ${config.rights.holderIsEditor},
    holderName: ${field(config.rights.holderName)},
    holderNote: ${field(config.rights.holderNote)},
  },
  tax: {
    regime: '${config.tax.regime}',
    note: ${quote(config.tax.note)},
  },
  salesScope: '${config.salesScope}',
  channels: SALES_CHANNELS,
}`;
}

/* ------------------------------------------------------------------ */
/* 8. Hébergement                                                      */
/* ------------------------------------------------------------------ */

/**
 * Hébergement du site.
 * Adresse issue de la Privacy Notice de Vercel ; le numéro est la ligne de
 * signalement DMCA/abus publiée par l'hébergeur (vercel.com/legal/dmca-policy).
 */
export const HOST = {
  name: 'Vercel Inc.',
  address: '440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis',
  phone: '+1 559 288 7060',
  phoneNote: 'ligne de signalement DMCA/abus publiée par l’hébergeur',
  email: 'dmca@vercel.com',
  website: 'https://vercel.com',
  infrastructure: 'réseau de diffusion (CDN) mondial, journaux techniques conservés par l’hébergeur',
} as const;
