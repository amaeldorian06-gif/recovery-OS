import { LicenseInfo, LicensePlan } from './types';
import { todayISO } from '../utils/dates';

/**
 * Licence locale — transparence volontaire.
 *
 * Ce mécanisme est une **activation de confort côté utilisateur** :
 * il vérifie la cohérence interne d'une clé et mémorise le plan choisi.
 * Ce n'est PAS un contrôle serveur inviolable : il ne protège pas contre
 * un utilisateur déterminé et ne doit jamais être présenté comme tel
 * (contrainte produit explicite).
 *
 * Format de clé : RRV-<PLAN>-<12 caractères base32>-<4 caractères de contrôle>
 * Le suffixe de contrôle est une somme de contrôle déterministe sur le corps.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans O/0/I/1 ambigus

const PLAN_CODES: Record<LicensePlan, string> = {
  trial: 'TRI',
  essentiel: 'ESS',
  pro: 'PRO',
  cabinet: 'CAB',
};

function controlChecksum(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum = (sum * 31 + body.charCodeAt(i)) % 1048576;
  }
  let out = '';
  for (let i = 0; i < 4; i++) {
    out = ALPHABET[sum % ALPHABET.length] + out;
    sum = Math.floor(sum / ALPHABET.length);
  }
  return out;
}

export function generateLicenseKey(plan: LicensePlan, random: () => number = Math.random): string {
  const code = PLAN_CODES[plan];
  let middle = '';
  for (let i = 0; i < 12; i++) {
    middle += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  const body = `RRV-${code}-${middle}`;
  return `${body}-${controlChecksum(body)}`;
}

export type LicenseValidation =
  | { ok: true; plan: LicensePlan }
  | { ok: false; reason: string };

export function validateLicenseKey(raw: string): LicenseValidation {
  const key = raw.trim().toUpperCase().replace(/\s+/g, '');
  const match = key.match(/^RRV-(TRI|ESS|PRO|CAB)-([A-Z2-9]{12})-([A-Z2-9]{4})$/);
  if (!match) {
    return { ok: false, reason: 'Format de clé invalide (attendu : RRV-PRO-XXXXXXXXXXXX-XXXX).' };
  }
  const body = `RRV-${match[1]}-${match[2]}`;
  if (controlChecksum(body) !== match[3]) {
    return { ok: false, reason: 'Code de contrôle de la clé non conforme.' };
  }
  const plan = (Object.entries(PLAN_CODES).find(([, code]) => code === match[1])?.[0] ?? 'essentiel') as LicensePlan;
  return { ok: true, plan };
}

export const PLAN_DETAILS: Record<LicensePlan, { label: string; seats: number; priceMonthly: number; features: string[] }> = {
  trial: {
    label: 'Essai 14 jours',
    seats: 1,
    priceMonthly: 0,
    features: ['Fonctionnalités complètes', 'Aucune carte bancaire', 'Données 100 % locales'],
  },
  essentiel: {
    label: 'Essentiel',
    seats: 1,
    priceMonthly: 19,
    features: ['Portefeuille illimité', 'Import / export CSV', 'Sauvegarde JSON', 'Score de risque explicable'],
  },
  pro: {
    label: 'Professionnel',
    seats: 3,
    priceMonthly: 49,
    features: ['Tout Essentiel', 'Journal d\'actions de recouvrement', 'Promesses et litiges suivis', 'Calculateur d\'intérêts de retard', '3 postes'],
  },
  cabinet: {
    label: 'Cabinet',
    seats: 10,
    priceMonthly: 89,
    features: ['Tout Professionnel', 'Multi-dossiers clients', 'Exports d\'audit renforcés', '10 postes'],
  },
};

/** Construit l'objet licence à stocker localement. */
export function buildLicense(plan: LicensePlan, key: string): LicenseInfo {
  return {
    key,
    plan,
    label: PLAN_DETAILS[plan].label,
    seats: PLAN_DETAILS[plan].seats,
    activatedAt: todayISO(),
    verification: 'locale',
  };
}
