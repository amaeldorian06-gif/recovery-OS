/**
 * Constructeur d'identité légale — logique pure, sans React.
 *
 * Sert la console interne : à partir des valeurs saisies, il produit une
 * configuration complète et signalée. Deux garanties, identiques à celles du
 * code livré :
 *
 *  1. ce qui n'a pas d'objet pour le type d'éditeur ou le pays n'est jamais
 *     réclamé : le champ passe en `not_applicable`, ce qui NE bloque pas ;
 *  2. ce qui est vide et nécessaire reste `to_complete` : rien n'est inventé.
 *
 * Le résultat est destiné à être collé dans `src/config/editor.ts`, puis
 * reconstruit. Aucune écriture de fichier, aucun appel réseau.
 */

import {
  EditorConfig,
  EditorType,
  LegalField,
  TaxRegime,
  notApplicable,
  provided,
  toComplete,
} from './editor';
import { Jurisdiction, getJurisdiction } from './jurisdictions';
import { SALES_CHANNELS } from './channels';

/* ------------------------------------------------------------------ */
/* 1. Saisie                                                           */
/* ------------------------------------------------------------------ */

export interface EditorDraft {
  type: EditorType;
  countryCode: string;
  taxRegime: TaxRegime;
  legalName: string;
  tradeName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  identifier: string;
  taxNumber: string;
  capital: string;
  domesticRegistry: string;
  publicationDirector: string;
}

/** Champs texte du formulaire, dans l'ordre d'affichage. */
export type DraftTextField =
  | 'legalName'
  | 'tradeName'
  | 'address'
  | 'postalCode'
  | 'city'
  | 'phone'
  | 'email'
  | 'identifier'
  | 'taxNumber'
  | 'capital'
  | 'domesticRegistry'
  | 'publicationDirector';

export const EMPTY_DRAFT: EditorDraft = {
  type: 'individual',
  countryCode: 'CM',
  taxRegime: 'no_french_vat',
  legalName: '',
  tradeName: 'Revenue Recovery OS',
  address: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
  identifier: '',
  taxNumber: '',
  capital: '',
  domesticRegistry: '',
  publicationDirector: '',
};

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  no_french_vat: 'Aucune TVA française (éditeur établi hors de France)',
  french_franchise: 'Franchise en base française (art. 293 B du CGI)',
  vat_registered: 'Assujetti à la TVA',
  to_verify: 'Régime à déterminer',
};

export const DRAFT_LABELS: Record<DraftTextField, string> = {
  legalName: 'Nom et prénoms / raison sociale',
  tradeName: 'Nom commercial du produit',
  address: 'Adresse professionnelle',
  postalCode: 'Code postal',
  city: 'Ville',
  phone: 'Téléphone',
  email: 'Courriel de contact',
  identifier: 'Numéro d’immatriculation ou de déclaration',
  taxNumber: 'Identifiant fiscal',
  capital: 'Capital social',
  domesticRegistry: 'Greffe / registre national',
  publicationDirector: 'Directeur de la publication',
};

/* ------------------------------------------------------------------ */
/* 2. Applicabilité conditionnelle                                     */
/* ------------------------------------------------------------------ */

export interface Applicability {
  applicable: boolean;
  /** Raison affichée lorsque le champ ne s'applique pas. */
  reason?: string;
}

/** Numéro d'immatriculation attendu, nommé selon la juridiction et le type. */
export function identifierLabelFor(type: EditorType, jurisdiction: Jurisdiction): string {
  const registry = type === 'company'
    ? jurisdiction.companyRegistry ?? jurisdiction.individualRegistry
    : jurisdiction.individualRegistry ?? jurisdiction.companyRegistry;
  if (!registry) return 'Numéro d’immatriculation';
  return type === 'company' ? `${registry.name} — numéro d’immatriculation` : registry.name;
}

/**
 * Un champ s'applique-t-il à cette combinaison type × pays ?
 * C'est ici que se joue la fin des 11 champs français imposés à un éditeur
 * camerounais : capital, code postal et greffe deviennent sans objet.
 */
export function applicabilityFor(
  key: DraftTextField,
  draft: Pick<EditorDraft, 'type' | 'countryCode'>
): Applicability {
  const jurisdiction = getJurisdiction(draft.countryCode);

  switch (key) {
    case 'capital':
      return draft.type === 'company'
        ? { applicable: true }
        : {
            applicable: false,
            reason: 'Une personne physique n’a pas de capital social : ce champ ne concerne que les sociétés.',
          };

    case 'postalCode':
      return jurisdiction.hasPostalCode
        ? { applicable: true }
        : {
            applicable: false,
            reason:
              jurisdiction.postalCodeNote ??
              'Ce pays n’attribue pas de code postal : l’adresse est identifiée par la ville et le quartier.',
          };

    case 'domesticRegistry':
      return jurisdiction.legalSystem === 'french'
        ? { applicable: true }
        : {
            applicable: false,
            reason: `L’éditeur n’est pas immatriculé en France : ni greffe ni numéro RCS français ne lui sont attribués.`,
          };

    case 'publicationDirector':
      return draft.type === 'company'
        ? { applicable: true }
        : {
            applicable: false,
            reason: 'Le directeur de la publication est l’éditeur lui-même, personne physique : la valeur est reprise du nom légal.',
          };

    // Champs toujours applicables : identité, coordonnées, identifiants.
    default:
      return { applicable: true };
  }
}

/** Champs obligatoires dès lors qu'ils s'appliquent. */
const REQUIRED_FIELDS: DraftTextField[] = [
  'legalName',
  'address',
  'postalCode',
  'city',
  'phone',
  'email',
  'identifier',
  'taxNumber',
  'capital',
  'domesticRegistry',
  'publicationDirector',
];

/** Champs facultatifs : jamais bloquants, mais affichés s'ils sont remplis. */
const OPTIONAL_FIELDS: DraftTextField[] = ['tradeName'];

/* ------------------------------------------------------------------ */
/* 3. Validation de la saisie                                          */
/* ------------------------------------------------------------------ */

export type DraftIssueSeverity = 'error' | 'warning';

export interface DraftIssue {
  field: DraftTextField | 'type' | 'countryCode';
  severity: DraftIssueSeverity;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_CHARSET = /^\+?[\d\s().-]+$/;
const PLACEHOLDER_PATTERN = /\[[^\]]{2,}\]/;

/**
 * Contrôle de la saisie.
 *
 * `error` empêche de copier la configuration : coller un bloc avec un champ
 * vide reviendrait à publier un document non finalisé.
 * `warning` signale un risque sans bloquer.
 */
export function validateDraft(draft: EditorDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const jurisdiction = getJurisdiction(draft.countryCode);

  for (const key of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    const applies = applicabilityFor(key, draft).applicable;
    const raw = draft[key].trim();

    if (applies && REQUIRED_FIELDS.includes(key) && raw.length === 0) {
      issues.push({ field: key, severity: 'error', message: `${DRAFT_LABELS[key]} : champ obligatoire vide.` });
      continue;
    }

    if (!applies && raw.length > 0) {
      issues.push({
        field: key,
        severity: 'warning',
        message: `${DRAFT_LABELS[key]} : valeur ignorée, ce champ ne s’applique pas à cette configuration.`,
      });
    }

    if (PLACEHOLDER_PATTERN.test(raw)) {
      issues.push({ field: key, severity: 'error', message: `${DRAFT_LABELS[key]} : emplacement de modèle non remplacé.` });
    }
  }

  const email = draft.email.trim();
  if (email.length > 0 && !EMAIL_PATTERN.test(email)) {
    issues.push({ field: 'email', severity: 'error', message: 'Courriel : format invalide.' });
  }
  if (email.endsWith('.example')) {
    issues.push({
      field: 'email',
      severity: 'warning',
      message: 'Courriel : le domaine .example est réservé (RFC 2606) et ne peut recevoir aucun message.',
    });
  }

  const phone = draft.phone.trim();
  if (phone.length > 0) {
    const digits = phone.replace(/\D/g, '');
    if (!PHONE_CHARSET.test(phone) || digits.length < 8) {
      issues.push({ field: 'phone', severity: 'error', message: 'Téléphone : au moins 8 chiffres, sans lettres.' });
    }
  }

  if (draft.type === 'individual' && jurisdiction.legalSystem === 'ohada') {
    issues.push({
      field: 'type',
      severity: 'warning',
      message:
        'Exercice en nom personnel : le statut applicable (commerçant, entreprenant déclaré ou activité civile) ' +
        'dépend de l’activité réellement exercée et reste à valider juridiquement.',
    });
  }

  return issues;
}

export function draftIsUsable(draft: EditorDraft): boolean {
  return validateDraft(draft).every(issue => issue.severity !== 'error');
}

/* ------------------------------------------------------------------ */
/* 4. Construction de la configuration                                 */
/* ------------------------------------------------------------------ */

const TAX_NOTES: Record<TaxRegime, string> = {
  no_french_vat:
    'L’éditeur n’est pas établi en France et ne dispose d’aucun numéro de TVA français. Les prix sont exprimés hors taxe. ' +
    'Pour une prestation B2B fournie à un client établi dans l’Union européenne, l’autoliquidation par le client est en ' +
    'principe applicable : à confirmer avec un conseil fiscal.',
  french_franchise: 'Franchise en base française : mention de l’article 293 B du CGI. Aucune TVA facturée.',
  vat_registered: 'Assujetti à la TVA : les prix sont hors taxes et la taxe est ajoutée sur la facture.',
  to_verify: 'Régime de taxe non déterminé : à trancher avant toute facturation.',
};

/** Transforme une saisie brute en champ typé, selon son applicabilité. */
function toField(
  raw: string,
  applicability: Applicability,
  label: string
): LegalField {
  const value = raw.trim();
  if (!applicability.applicable) {
    return notApplicable(applicability.reason ?? 'Sans objet pour cette configuration.');
  }
  if (value.length === 0) return toComplete(label);
  return provided(value);
}

/**
 * Produit la configuration complète correspondant à la saisie.
 * Les champs non applicables portent leur justification ; les champs vides
 * restent explicitement à compléter.
 */
export function buildConfigFromDraft(draft: EditorDraft): EditorConfig {
  const jurisdiction = getJurisdiction(draft.countryCode);
  const isCompanyDraft = draft.type === 'company';
  const identifierLabel = identifierLabelFor(draft.type, jurisdiction);

  const app = (key: DraftTextField): Applicability => applicabilityFor(key, draft);
  const field = (key: DraftTextField, label = DRAFT_LABELS[key]): LegalField =>
    toField(draft[key], app(key), label);

  return {
    type: draft.type,
    countryCode: draft.countryCode,

    identity: {
      legalName: field('legalName'),
      tradeName: field('tradeName'),
      address: field('address'),
      postalCode: field('postalCode'),
      city: field('city'),
      phone: field('phone'),
      email: field('email'),
    },

    registration: {
      identifier: field('identifier', identifierLabel),
      identifierLabel,
      identifierCountry: provided(jurisdiction.name),
      taxNumber: field('taxNumber', `Numéro fiscal — ${jurisdiction.taxIdentifierLabel ?? 'identifiant fiscal'}`),
      capital: field('capital'),
      domesticRegistry: field('domesticRegistry'),
    },

    publication: {
      directorIsEditor: !isCompanyDraft,
      directorName: isCompanyDraft
        ? field('publicationDirector')
        : notApplicable(
            'Le directeur de la publication est l’éditeur lui-même, personne physique : la valeur est reprise de l’identité.'
          ),
      directorContact: notApplicable(
        'Le contact de la direction de la publication est l’adresse e-mail de l’éditeur.'
      ),
    },

    rights: {
      holderIsEditor: true,
      holderName: notApplicable('Les droits sont détenus par l’éditeur : aucun cessionnaire n’est identifié.'),
      holderNote: provided(
        'Le code source est distribué sous licence Apache 2.0 ; la licence ne confère aucun droit sur la marque ni sur les contenus rédactionnels.'
      ),
    },

    tax: {
      regime: draft.taxRegime,
      note: TAX_NOTES[draft.taxRegime],
    },

    // Décision produit inchangée : vente aux professionnels, pas de prestataire
    // de paiement intégré, plateformes de distribution au rôle non qualifié.
    salesScope: 'b2b',
    channels: SALES_CHANNELS,
  };
}
