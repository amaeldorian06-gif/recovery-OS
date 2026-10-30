/**
 * Analyse et formatage monétaires pour le marché francophone européen.
 *
 * Règles de parsing (documentées et testées) :
 *  - Espaces normales, insécables et fines supprimées.
 *  - Symboles monétaires retirés (€, $, CHF, USD, EUR…).
 *  - Si les deux séparateurs `,` et `.` apparaissent, le **dernier** est décimal.
 *  - Si un seul apparaît :
 *      - `,` suivi de 1-2 chiffres  → décimal (ex. `1234,56`)
 *      - `.` suivi de 1-2 chiffres  → décimal (ex. `1234.56`)
 *      - suivi de **3** chiffres exactement → séparateur de milliers
 *        (ex. `1.234` = 1234 en EU ; casse volontairement l'ambiguïté US `1.234`
 *        au profit du marché cible francophone — documenté dans l'aperçu d'import)
 *      - sinon → rejet explicite (jamais de valeur silencieuse)
 *  - Les nombres en parenthèses `(1 234,56)` sont négatifs (convention comptable).
 *  - Aucun résultat silencieux : chaque échec porte un message.
 */

export type ParsedAmount =
  | { ok: true; value: number; format: 'eu' | 'us' | 'plain'; ambiguous: boolean }
  | { ok: false; reason: string; input: string };

const SYMBOL_RE = /€|\$|USD|EUR|CHF|GBP|FCFA|XAF|XOF|CAD|AUD/g;
const SPACE_RE = /[\s  ']/g;

export function normalizeAmountInput(raw: string | number): string {
  if (typeof raw === 'number') {
    return String(raw);
  }
  return String(raw).replace(SYMBOL_RE, '').replace(SPACE_RE, '').trim();
}

/**
 * Analyse un montant brut (CSV, saisie utilisateur).
 */
export function parseAmount(raw: string | number | null | undefined): ParsedAmount {
  if (raw === null || raw === undefined) {
    return { ok: false, input: '', reason: 'Montant absent' };
  }
  const input = String(raw);
  let s = normalizeAmountInput(raw);
  if (!s) {
    return { ok: false, input, reason: 'Montant vide' };
  }

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }

  if (!/^[0-9.,]+$/.test(s)) {
    return { ok: false, input, reason: `Caractères invalides dans le montant "${input}"` };
  }

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let decimalSep: ',' | '.' | null = null;
  let ambiguous = false;

  if (lastComma >= 0 && lastDot >= 0) {
    decimalSep = lastComma > lastDot ? ',' : '.';
  } else if (lastComma >= 0) {
    const decimals = s.length - lastComma - 1;
    if (decimals === 3) {
      decimalSep = null; // milliers EU : 1.234 / 1,234
      ambiguous = true;
    } else if (decimals >= 1 && decimals <= 2) {
      decimalSep = ',';
    } else {
      return { ok: false, input, reason: `Séparateur décimal invalide dans "${input}"` };
    }
  } else if (lastDot >= 0) {
    const decimals = s.length - lastDot - 1;
    if (decimals === 3) {
      decimalSep = null; // milliers : 1.234
      ambiguous = true;
    } else if (decimals >= 1 && decimals <= 2) {
      decimalSep = '.';
    } else {
      return { ok: false, input, reason: `Séparateur décimal invalide dans "${input}"` };
    }
  }

  let cleaned: string;
  if (decimalSep) {
    cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    if (decimalSep === '.') {
      cleaned = s.replace(/,/g, '');
    }
  } else {
    cleaned = s.replace(/[.,]/g, '');
  }

  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return { ok: false, input, reason: `Montant illisible : "${input}"` };
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    return { ok: false, input, reason: `Montant non numérique : "${input}"` };
  }

  const format: 'eu' | 'us' | 'plain' = decimalSep === ',' ? 'eu' : decimalSep === '.' ? 'us' : 'plain';
  return { ok: true, value: negative ? -value : value, format, ambiguous };
}

/** Arrondi comptable à 2 décimales (évite les artefacts binaires). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Devise de référence du marché francophone. */
export const DEFAULT_CURRENCY = 'EUR';

const FALLBACK_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  XAF: 'FCFA',
  XOF: 'FCFA',
  CAD: '$',
};

/** Formatage monétaire localisé (fr-FR par défaut). */
export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const cur = (currency || DEFAULT_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = FALLBACK_SYMBOLS[cur] ?? cur;
    return `${Math.round(amount).toLocaleString('fr-FR')} ${symbol}`;
  }
}
