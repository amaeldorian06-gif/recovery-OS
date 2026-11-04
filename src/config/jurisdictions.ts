/**
 * Référentiels par pays.
 *
 * Aucune obligation nationale n'est présentée comme universelle : chaque
 * registre, autorité et formalisme est rattaché au pays de l'éditeur. Un champ
 * qui n'existe pas dans le pays concerné est déclaré « non applicable » plutôt
 * que laissé vide ou rempli par une valeur fictive.
 *
 * Sources principales :
 *  - OHADA, Acte uniforme portant sur le droit commercial général (rév. 15 déc. 2010),
 *    art. 30 : statut de l'entreprenant, dispense d'immatriculation au RCCM mais
 *    obligation de déclaration d'activité et mention sur les documents professionnels.
 *  - France : LCEN art. 1-1 (ex-art. 6-III, déplacé par la loi SREN du 21 mai 2024).
 */

export type LegalSystem = 'ohada' | 'french' | 'other';

export interface Registry {
  /** Nom court affiché dans les documents. */
  name: string;
  /** Explication destinée à l'éditeur, pas au public. */
  note: string;
  /** Mention légale obligatoire à faire figurer sur les documents, le cas échéant. */
  requiredMention?: string;
}

export interface DataProtectionAuthority {
  name: string;
  website: string;
  note?: string;
}

export interface Jurisdiction {
  code: string;
  name: string;
  legalSystem: LegalSystem;
  /** Le pays attribue-t-il des codes postaux utilisés couramment ? */
  hasPostalCode: boolean;
  postalCodeNote?: string;
  companyRegistry: Registry | null;
  individualRegistry: Registry | null;
  taxAuthority: string | null;
  /** Dénomination locale du numéro fiscal, si elle est connue. */
  taxIdentifierLabel: string | null;
  currency: string;
  dataProtectionAuthority: DataProtectionAuthority | null;
  /** Autorité ou cadre régional de protection des données, le cas échéant. */
  dataProtectionNote?: string;
}

export const JURISDICTIONS: Record<string, Jurisdiction> = {
  CM: {
    code: 'CM',
    name: 'Cameroun',
    legalSystem: 'ohada',
    // Le Cameroun n'utilise pas de code postal généralisé : l'adresse postale
    // est identifiée par la ville, le quartier et éventuellement une boîte postale.
    hasPostalCode: false,
    postalCodeNote:
      'Le Cameroun ne dispose pas d’un système de code postal généralisé. L’adresse est identifiée par la ville et le quartier.',
    companyRegistry: {
      name: 'RCCM',
      note: 'Registre du commerce et du crédit mobilier (OHADA). Obligatoire pour une société.',
    },
    individualRegistry: {
      name: 'RCCM — déclaration d’activité',
      note:
        'L’entreprenant personne physique est dispensé d’immatriculation au RCCM mais doit déclarer son activité et obtenir un numéro de déclaration (AUDCG, art. 30).',
      requiredMention: 'Entreprenant dispensé d’immatriculation',
    },
    taxAuthority: 'Direction générale des impôts (DGI)',
    taxIdentifierLabel: 'Numéro d’identifiant unique (NIU)',
    currency: 'XAF',
    dataProtectionAuthority: null,
    dataProtectionNote:
      'Le cadre camerounais de protection des données (loi n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité, et textes d’application) ne prévoit pas d’autorité de contrôle équivalente à la CNIL. Une vérification juridique est nécessaire.',
  },
  FR: {
    code: 'FR',
    name: 'France',
    legalSystem: 'french',
    hasPostalCode: true,
    companyRegistry: {
      name: 'RCS',
      note: 'Registre du commerce et des sociétés. Numéro SIREN à 9 chiffres.',
    },
    individualRegistry: {
      name: 'Répertoire SIRENE',
      note: 'Immatriculation des entreprises et entrepreneurs individuels (numéro SIREN/SIRET).',
    },
    taxAuthority: 'Direction générale des finances publiques (DGFiP)',
    taxIdentifierLabel: 'Numéro de TVA intracommunautaire',
    currency: 'EUR',
    dataProtectionAuthority: {
      name: 'Commission nationale de l’informatique et des libertés (CNIL)',
      website: 'https://www.cnil.fr',
    },
  },
  BE: {
    code: 'BE',
    name: 'Belgique',
    legalSystem: 'other',
    hasPostalCode: true,
    companyRegistry: { name: 'Banque-Carrefour des Entreprises (BCE)', note: 'Numéro d’entreprise à 10 chiffres.' },
    individualRegistry: { name: 'Banque-Carrefour des Entreprises (BCE)', note: 'Inscription des personnes physiques commerçantes.' },
    taxAuthority: 'SPF Finances',
    taxIdentifierLabel: 'Numéro de TVA',
    currency: 'EUR',
    dataProtectionAuthority: { name: 'Autorité de protection des données (APD)', website: 'https://www.autoriteprotectiondonnees.be' },
  },
  CI: {
    code: 'CI',
    name: 'Côte d’Ivoire',
    legalSystem: 'ohada',
    hasPostalCode: false,
    postalCodeNote: 'L’adresse est identifiée par la ville et le quartier.',
    companyRegistry: { name: 'RCCM', note: 'Registre du commerce et du crédit mobilier (OHADA).' },
    individualRegistry: {
      name: 'RCCM — déclaration d’activité',
      note: 'Statut de l’entreprenant (AUDCG, art. 30).',
      requiredMention: 'Entreprenant dispensé d’immatriculation',
    },
    taxAuthority: 'Direction générale des impôts (DGI)',
    taxIdentifierLabel: 'Numéro de compte contribuable (NCC)',
    currency: 'XOF',
    dataProtectionAuthority: { name: 'Autorité de régulation des télécommunications (ARTCI)', website: 'https://www.artci.ci' },
  },
};

/**
 * Juridiction de repli pour un pays non couvert.
 * Aucun registre ni numéro fiscal n'est supposé : tout est marqué à vérifier.
 */
export function genericJurisdiction(code: string, name: string): Jurisdiction {
  return {
    code,
    name,
    legalSystem: 'other',
    hasPostalCode: true,
    companyRegistry: null,
    individualRegistry: null,
    taxAuthority: null,
    taxIdentifierLabel: null,
    currency: '',
    dataProtectionAuthority: null,
    dataProtectionNote:
      'Aucun référentiel n’est enregistré pour ce pays. Les registres, numéros fiscaux et l’autorité de protection des données doivent être vérifiés.',
  };
}

export function getJurisdiction(code: string): Jurisdiction {
  return JURISDICTIONS[code.toUpperCase()] ?? genericJurisdiction(code.toUpperCase(), code.toUpperCase());
}
