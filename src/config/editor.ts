/**
 * Identité légale de l'éditeur — source unique.
 *
 * ⚠️ Les valeurs entre crochets sont des CHAMPS À COMPLÉTER. Le produit ne peut
 * pas être mis en vente avec ces valeurs : la page affiche un bandeau
 * « document non finalisé » tant qu'il en reste, et `npm run legal:check`
 * les liste.
 *
 * Pourquoi ne pas les avoir inventées : une raison sociale, un SIREN ou une
 * adresse erronés dans des mentions légales constituent une fausse déclaration
 * (LCEN art. 1-2) en plus d'être juridiquement inopérants. Seul l'éditeur peut
 * fournir ces éléments.
 *
 * Références à jour au 3 novembre 2026 :
 *  - LCEN, art. 1-1 (et non plus art. 6-III, abrogé par la loi SREN du 21 mai 2024)
 *  - Code de la consommation, art. L111-1, L221-5, L221-18, L221-28
 *  - Code de commerce, art. L441-1, L441-10, D441-5
 */

export interface MediatorInfo {
  name: string;
  address: string;
  website: string;
  phone?: string;
}

export interface EditorInfo {
  /** Dénomination sociale ou nom commercial de l'éditeur. */
  legalName: string;
  /** Forme juridique : SASU, SARL, EI, micro-entreprise… */
  legalForm: string;
  /** Capital social (vide si entreprise individuelle). */
  capital: string;
  /** Numéro SIREN ou SIRET, sans espaces. */
  siren: string;
  /** Ville du greffe (RCS) — vide pour une entreprise individuelle. */
  rcsCity: string;
  /** Numéro de TVA intracommunautaire, ou chaîne vide si non assujetti. */
  vatNumber: string;
  /** Franchise en base de TVA (art. 293 B du CGI). */
  vatExempt: boolean;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  /** Directeur de la publication (représentant légal). */
  publicationDirector: string;
  /** Médiateur de la consommation agréé CECMC — obligatoire en vente B2C. */
  mediator: MediatorInfo | null;
}

export const EDITOR: EditorInfo = {
  legalName: '[RAISON SOCIALE À COMPLÉTER]',
  legalForm: '[FORME JURIDIQUE]',
  capital: '[CAPITAL SOCIAL]',
  siren: '[SIREN / SIRET]',
  rcsCity: '[VILLE DU GREFFE]',
  vatNumber: '[N° TVA INTRACOMMUNAUTAIRE]',
  vatExempt: false,
  address: '[ADRESSE DU SIÈGE]',
  postalCode: '[CODE POSTAL]',
  city: '[VILLE]',
  country: 'France',
  phone: '[TÉLÉPHONE]',
  email: 'contact@recovery-os.example',
  publicationDirector: '[NOM DU DIRECTEUR DE LA PUBLICATION]',
  mediator: null,
};

/**
 * Hébergement du site.
 * Adresse issue de la Privacy Notice de Vercel (440 N Barranca Ave #4133,
 * Covina, CA 91723). Le numéro indiqué est la ligne de signalement DMCA/abus
 * publiée par l'hébergeur : à revérifier sur vercel.com/legal avant publication.
 */
export const HOST = {
  name: 'Vercel Inc.',
  address: '440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis',
  phone: '+1 559 288 7060',
  website: 'https://vercel.com',
  /** Région d'exécution des fonctions ; le site est servi en statique depuis un CDN. */
  infrastructure: 'réseau de diffusion (CDN) mondial, journaux techniques conservés par l’hébergeur',
} as const;

/** Nom du produit tel qu'il apparaît dans les documents contractuels. */
export const PRODUCT = 'Revenue Recovery OS';

/** Date de dernière révision des documents légaux (ISO). */
export const LEGAL_UPDATED_AT = '2026-11-03';

/**
 * Détection des champs non renseignés : tout crochet contenant du texte.
 *
 * Version initiale restreinte à un jeu de caractères — elle laissait passer
 * « [N° TVA INTRACOMMUNAUTAIRE] » à cause du symbole °, donc une TVA non
 * renseignée n'était pas signalée. Le motif large est volontaire.
 *
 * Expression SANS drapeau `g` : avec `g`, `RegExp.test` conserve `lastIndex`
 * entre les appels et renvoie des résultats alternés.
 */
const PLACEHOLDER_PATTERN = /\[[^\]]{2,}\]/;

/** Liste des champs d'identification encore non renseignés. */
export function missingLegalFields(): string[] {
  const values: Array<[string, string]> = [
    ['Raison sociale', EDITOR.legalName],
    ['Forme juridique', EDITOR.legalForm],
    ['Capital social', EDITOR.capital],
    ['SIREN / SIRET', EDITOR.siren],
    ['Ville du greffe', EDITOR.rcsCity],
    ...(EDITOR.vatExempt ? [] : [['Numéro de TVA', EDITOR.vatNumber] as [string, string]]),
    ['Adresse', EDITOR.address],
    ['Code postal', EDITOR.postalCode],
    ['Ville', EDITOR.city],
    ['Téléphone', EDITOR.phone],
    ['Directeur de la publication', EDITOR.publicationDirector],
  ];

  const missing = values
    .filter(([, value]) => PLACEHOLDER_PATTERN.test(value))
    .map(([label]) => label);

  if (EDITOR.email.endsWith('.example')) missing.push('Adresse e-mail de contact');
  if (!EDITOR.mediator) missing.push('Médiateur de la consommation (obligatoire en vente aux particuliers)');

  return missing;
}

/** Vrai tant que l'identité légale n'est pas complète. */
export function isLegalIdentityIncomplete(): boolean {
  return missingLegalFields().length > 0;
}

/** Adresse du siège sur une ligne, lisible dans un document. */
export function editorAddressLine(): string {
  return `${EDITOR.address}, ${EDITOR.postalCode} ${EDITOR.city}, ${EDITOR.country}`;
}
