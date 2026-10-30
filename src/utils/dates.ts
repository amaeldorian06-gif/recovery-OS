/**
 * Utilitaires de dates fiables pour le pilotage des créances.
 *
 * Règles :
 *  - Toute date est stockée en ISO `YYYY-MM-DD` (sans heure, sans fuseau).
 *  - Le calcul du retard utilise TOUJOURS la date locale du navigateur,
 *    sauf référence explicite fournie (tests, imports figés).
 *  - Aucune valeur par défaut silencieuse : une date illisible est une erreur.
 */

export type ParsedDate =
  | { ok: true; iso: string }
  | { ok: false; reason: string; input: string };

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const FR_RE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
const YMD_SLASH_RE = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Date locale courante au format ISO (pas de UTC, pas de décalage de fuseau). */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function buildIso(year: number, month: number, day: number, input: string): ParsedDate {
  if (month < 1 || month > 12) {
    return { ok: false, input, reason: `Mois invalide (${month}) dans "${input}"` };
  }
  if (day < 1 || day > 31) {
    return { ok: false, input, reason: `Jour invalide (${day}) dans "${input}"` };
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return { ok: false, input, reason: `Date inexistante dans "${input}" (ex. 31/02)` };
  }
  return { ok: true, iso: `${year}-${pad(month)}-${pad(day)}` };
}

/**
 * Analyse une date saisie par un utilisateur ou un import CSV.
 * Formats acceptés : `YYYY-MM-DD`, `YYYY/MM/DD`, `JJ/MM/AAAA`, `JJ-MM-AAAA`, `JJ.MM.AAAA`.
 * `JJ/MM/AAAA` est le format prioritaire du marché francophone.
 */
export function parseDateInput(raw: string | number | null | undefined): ParsedDate {
  if (raw === null || raw === undefined) {
    return { ok: false, input: '', reason: 'Date absente' };
  }
  const input = String(raw).trim();
  if (!input) {
    return { ok: false, input, reason: 'Date vide' };
  }

  const iso = input.match(ISO_RE);
  if (iso) {
    return buildIso(Number(iso[1]), Number(iso[2]), Number(iso[3]), input);
  }

  const ymd = input.match(YMD_SLASH_RE);
  if (ymd) {
    return buildIso(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]), input);
  }

  const fr = input.match(FR_RE);
  if (fr) {
    const day = Number(fr[1]);
    const month = Number(fr[2]);
    // Ambiguïté MM/JJ : sur le marché francophone, le jour vient en premier.
    return buildIso(Number(fr[3]), month, day, input);
  }

  return {
    ok: false,
    input,
    reason: `Format de date non reconnu dans "${input}" (attendu : JJ/MM/AAAA ou AAAA-MM-JJ)`,
  };
}

/** Vérifie qu'une chaîne est une date ISO valide. */
export function isValidISODate(value: string): boolean {
  return parseDateInput(value).ok;
}

/**
 * Nombre de jours entiers entre deux dates ISO : `to - from`.
 * Résultat négatif si `to` est antérieur à `from`.
 */
export function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`).getTime();
  const to = new Date(`${toISO}T00:00:00Z`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) {
    return 0;
  }
  return Math.round((to - from) / 86_400_000);
}

/**
 * Jours de retard d'une échéance par rapport à une date de référence.
 * Retourne un nombre négatif si l'échéance est dans le futur.
 */
export function daysPastDue(dueDateISO: string, asOfISO?: string): number {
  const parsed = parseDateInput(dueDateISO);
  if (!parsed.ok) {
    throw new Error(`daysPastDue : ${parsed.reason}`);
  }
  return daysBetween(parsed.iso, asOfISO ?? todayISO());
}

/** Ajoute des jours calendaires à une date ISO. */
export function addDaysISO(isoDate: string, days: number): string {
  const parsed = parseDateInput(isoDate);
  if (!parsed.ok) {
    throw new Error(`addDaysISO : ${parsed.reason}`);
  }
  const dt = new Date(`${parsed.iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Affichage local court : `12 oct. 2026`. */
export function formatDisplayDate(isoDate: string, locale = 'fr-FR'): string {
  const parsed = parseDateInput(isoDate);
  if (!parsed.ok) return isoDate;
  const [y, m, d] = parsed.iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dt);
  } catch {
    return parsed.iso;
  }
}
