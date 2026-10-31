import { Repository } from './repository';
import { SCHEMA_VERSION } from './types';
import { parseDateInput, todayISO } from '../utils/dates';

/**
 * Sauvegarde et restauration.
 *
 * Une sauvegarde est un fichier JSON autonome, versionné et scellé par
 * empreinte SHA-256 (avec repli déterministe si Web Crypto est indisponible).
 * La restauration passe obligatoirement par une inspection + prévisualisation
 * avant toute écriture : aucune opération destructive n'est possible sans
 * confirmation explicite de l'utilisateur.
 */

export const BACKUP_FORMAT = 'revenue-recovery-os-backup';
export const BACKUP_VERSION = 1;

export interface BackupPayload {
  invoices: unknown[];
  payments: unknown[];
  promises: unknown[];
  disputes: unknown[];
  actions: unknown[];
  history: unknown[];
  settings: unknown | null;
  organization: { id: string; name: string; defaultCurrency: string; createdAt: string } | null;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  schemaVersion: number;
  exportedAt: string;
  application: 'Revenue Recovery OS';
  payload: BackupPayload;
  counts: Record<string, number>;
  checksum: string;
  checksumAlgorithm: 'sha-256' | 'fallback-djb2';
}

export interface BackupInspection {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
  exportedAt: string | null;
  organizationName: string | null;
  dateRange: { earliestDue: string | null; latestDue: string | null } | null;
  checksumOk: boolean;
  previewSample: Array<{ invoiceNumber: string; customerName: string; dueDate: string; totalAmount: number; currency: string }>;
}

export interface RestoreReport {
  mode: 'replace' | 'merge';
  invoices: number;
  payments: number;
  promises: number;
  disputes: number;
  actions: number;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

async function digest(input: string): Promise<{ hex: string; algorithm: 'sha-256' | 'fallback-djb2' }> {
  try {
    const subtleCrypto = globalThis.crypto?.subtle;
    if (!subtleCrypto) throw new Error('subtle indisponible');
    const bytes = new TextEncoder().encode(input);
    const hashBuffer = await subtleCrypto.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return { hex, algorithm: 'sha-256' };
  } catch {
    // Repli déterministe documenté : n'aide qu'à détecter une altération,
    // pas à résister à une falsification volontaire.
    let h1 = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h1 ^= input.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193) >>> 0;
    }
    let h2 = 0x1b873593;
    for (let i = input.length - 1; i >= 0; i--) {
      h2 ^= input.charCodeAt(i);
      h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    }
    return { hex: `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`, algorithm: 'fallback-djb2' };
  }
}

export async function computeChecksum(payload: BackupPayload): Promise<{ hex: string; algorithm: 'sha-256' | 'fallback-djb2' }> {
  return digest(canonicalJson(payload));
}

/** Génère une sauvegarde complète à partir de la base locale. */
export async function exportBackup(repo: Repository, organizationId: string): Promise<BackupFile> {
  const snapshot = await repo.readAllForBackup(organizationId);
  const payload: BackupPayload = {
    invoices: snapshot.invoices,
    payments: snapshot.payments,
    promises: snapshot.promises,
    disputes: snapshot.disputes,
    actions: snapshot.actions,
    history: snapshot.history,
    settings: snapshot.settings ?? null,
    organization: snapshot.org ?? null,
  };
  const { hex, algorithm } = await computeChecksum(payload);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    application: 'Revenue Recovery OS',
    payload,
    counts: {
      invoices: snapshot.invoices.length,
      payments: snapshot.payments.length,
      promises: snapshot.promises.length,
      disputes: snapshot.disputes.length,
      actions: snapshot.actions.length,
      history: snapshot.history.length,
    },
    checksum: hex,
    checksumAlgorithm: algorithm,
  };
}

/** Contrôle d'intégrité + prévisualisation, sans aucune écriture. */
export async function inspectBackup(raw: string): Promise<BackupInspection> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const empty: BackupInspection = {
    valid: false,
    errors,
    warnings,
    counts: {},
    exportedAt: null,
    organizationName: null,
    dateRange: null,
    checksumOk: false,
    previewSample: [],
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    errors.push('Le fichier n\'est pas un JSON valide.');
    return empty;
  }

  if (!parsed || typeof parsed !== 'object') {
    errors.push('Structure de sauvegarde illisible.');
    return empty;
  }

  const file = parsed as Partial<BackupFile>;
  if (file.format !== BACKUP_FORMAT) {
    errors.push(`Format inattendu : « ${String(file.format)} » (attendu « ${BACKUP_FORMAT} »).`);
  }
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    errors.push(`Version de sauvegarde non prise en charge : ${String(file.version)}.`);
  }
  if (!file.payload || typeof file.payload !== 'object') {
    errors.push('Bloc de données (payload) absent.');
    return { ...empty, errors };
  }
  if (typeof file.schemaVersion === 'number' && file.schemaVersion > SCHEMA_VERSION) {
    errors.push(`Sauvegarde créée par une version plus récente du schéma (${file.schemaVersion} > ${SCHEMA_VERSION}).`);
  }

  const payload = file.payload as BackupPayload;
  const arrays: Array<[string, unknown[] | undefined]> = [
    ['invoices', payload.invoices],
    ['payments', payload.payments],
    ['promises', payload.promises],
    ['disputes', payload.disputes],
    ['actions', payload.actions],
    ['history', payload.history],
  ];
  const counts: Record<string, number> = {};
  for (const [name, list] of arrays) {
    if (list === undefined) {
      errors.push(`Collection « ${name} » absente de la sauvegarde.`);
      counts[name] = 0;
    } else if (!Array.isArray(list)) {
      errors.push(`Collection « ${name} » invalide.`);
      counts[name] = 0;
    } else {
      counts[name] = list.length;
    }
  }

  // Empreinte
  let checksumOk = false;
  if (file.checksum && file.checksumAlgorithm) {
    const recomputed = await computeChecksum(payload);
    checksumOk = recomputed.hex === file.checksum;
    if (!checksumOk) {
      errors.push('Empreinte de contrôle (checksum) non conforme : le fichier a été modifié ou tronqué.');
    }
    if (recomputed.algorithm !== file.checksumAlgorithm) {
      warnings.push(`Algorithme d'empreinte différent (${file.checksumAlgorithm} vs ${recomputed.algorithm}).`);
    }
  } else {
    warnings.push('Aucune empreinte de contrôle dans ce fichier.');
  }

  // Cohérence interne minimale
  const invoiceList = Array.isArray(payload.invoices) ? (payload.invoices as Array<Record<string, unknown>>) : [];
  const invoiceIds = new Set(invoiceList.map(i => String(i.id)));
  const dueDates: string[] = [];
  for (const inv of invoiceList) {
    if (typeof inv.totalAmount !== 'number' || inv.totalAmount < 0) {
      errors.push(`Facture ${String(inv.id)} : montant total invalide.`);
    }
    if (typeof inv.dueDate === 'string') {
      const parsedDate = parseDateInput(inv.dueDate);
      if (parsedDate.ok) dueDates.push(parsedDate.iso);
      else warnings.push(`Facture ${String(inv.invoiceNumber)} : échéance illisible (${inv.dueDate}).`);
    }
  }
  const paymentsList = Array.isArray(payload.payments) ? (payload.payments as Array<Record<string, unknown>>) : [];
  for (const p of paymentsList) {
    if (!invoiceIds.has(String(p.invoiceId))) {
      warnings.push(`Encaissement ${String(p.id)} référencé une facture absente de la sauvegarde.`);
    }
  }
  if (invoiceList.length === 0) {
    warnings.push('Cette sauvegarde ne contient aucune facture.');
  }

  const sortedDates = dueDates.sort();
  const previewSample = invoiceList.slice(0, 5).map(inv => ({
    invoiceNumber: String(inv.invoiceNumber ?? '?'),
    customerName: String(inv.customerName ?? '?'),
    dueDate: String(inv.dueDate ?? ''),
    totalAmount: Number(inv.totalAmount ?? 0),
    currency: String(inv.currency ?? 'EUR'),
  }));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : null,
    organizationName: payload.organization?.name ?? null,
    dateRange: sortedDates.length
      ? { earliestDue: sortedDates[0], latestDue: sortedDates[sortedDates.length - 1] }
      : null,
    checksumOk,
    previewSample,
  };
}

/**
 * Restaure une sauvegarde préalablement inspectée.
 * `confirmation` doit valoir exactement « RESTAURER » pour le mode remplacement :
 * garde-fou explicite contre les opérations destructives accidentelles.
 */
export async function restoreBackup(
  repo: Repository,
  organizationId: string,
  raw: string,
  options: { mode: 'replace' | 'merge'; confirmation?: string }
): Promise<RestoreReport> {
  const inspection = await inspectBackup(raw);
  if (!inspection.valid) {
    throw new Error(`Sauvegarde refusée : ${inspection.errors.join(' / ')}`);
  }

  const file = JSON.parse(raw) as BackupFile;
  const payload = file.payload as BackupPayload;

  if (options.mode === 'replace' && options.confirmation !== 'RESTAURER') {
    throw new Error(
      'Restauration en remplacement refusée : confirmation explicite requise (saisir RESTAURER).'
    );
  }

  const invoices = payload.invoices as never[];
  const payments = payload.payments as never[];
  const promises = payload.promises as never[];
  const disputes = payload.disputes as never[];
  const actions = payload.actions as never[];
  const history = (payload.history ?? []) as never[];

  if (options.mode === 'replace') {
    await repo.replaceOrganizationData(
      organizationId,
      {
        invoices,
        payments,
        promises,
        disputes,
        actions,
        history,
        settings: (payload.settings ?? undefined) as never,
      },
      { label: `fichier du ${file.exportedAt ?? todayISO()}` }
    );
  } else {
    const merge = await repo.mergeOrganizationData(
      organizationId,
      { invoices, payments, promises, disputes, actions },
      { label: `fichier du ${file.exportedAt ?? todayISO()}` }
    );
    void merge;
  }

  return {
    mode: options.mode,
    invoices: invoices.length,
    payments: payments.length,
    promises: promises.length,
    disputes: disputes.length,
    actions: actions.length,
  };
}

/** Sérialise une sauvegarde pour téléchargement. */
export function backupToFileParts(backup: BackupFile): { filename: string; content: string } {
  const date = todayISO();
  return {
    filename: `sauvegarde-revenue-recovery-os-${date}.json`,
    content: JSON.stringify(backup, null, 2),
  };
}
