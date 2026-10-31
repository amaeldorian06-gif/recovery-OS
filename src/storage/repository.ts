import { InvoiceRecord } from '../types';
import { StorageBackend, StorageTx } from './backend';
import {
  ActionRecord,
  DisputeRecord,
  HistoryEntry,
  IntegrityIssue,
  IntegrityReport,
  LicenseInfo,
  LocalUser,
  Organization,
  PaymentRecord,
  PromiseRecord,
  PromiseStatus,
  SCHEMA_VERSION,
  SettingsRecord,
  SessionRecord,
  StoreName,
  StoredInvoice,
  UserRole,
} from './types';
import { validateInvoiceRecord, withDerivedFields } from '../utils/financial';
import { roundMoney, DEFAULT_CURRENCY } from '../utils/money';
import { parseDateInput, todayISO } from '../utils/dates';

const ALL_STORES: StoreName[] = [
  'meta', 'organizations', 'users', 'sessions',
  'invoices', 'payments', 'promises', 'disputes', 'actions', 'history', 'settings',
];

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

export type ImportMode = 'replace' | 'merge' | 'update';

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  mode: ImportMode;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
}

export interface AuthResult {
  user: Omit<LocalUser, 'passwordHash' | 'saltHex'>;
  token: string;
  organization: Organization;
}

/* ------------------------------------------------------------------ */
/* Cryptographie locale (Web Crypto)                                   */
/* ------------------------------------------------------------------ */

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto indisponible : impossible de sécuriser le mot de passe.');
  }
  return c.subtle;
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await subtle().importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: 120_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function randomHex(byteLength: number): Promise<string> {
  const buf = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

function newId(prefix: string): string {
  const rand = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Repository                                                          */
/* ------------------------------------------------------------------ */

/**
 * Couche d'accès métier unique.
 * Règle : aucun composant ne touche le backend directement.
 * Toute mutation écrit une entrée dans le journal `history`.
 */
export class Repository {
  constructor(private readonly backend: StorageBackend) {}

  async init(): Promise<{ schemaVersion: number; migrated: boolean }> {
    await this.backend.open();
    return this.backend.writeTx(['meta'], async tx => {
      const current = await tx.get<{ key: string; value: number }>('meta', 'schemaVersion');
      if (!current) {
        await tx.put('meta', { key: 'schemaVersion', value: SCHEMA_VERSION });
        return { schemaVersion: SCHEMA_VERSION, migrated: false };
      }
      if (current.value === SCHEMA_VERSION) {
        return { schemaVersion: current.value, migrated: false };
      }
      // Point d'extension des futures migrations v1 → v2 → …
      await tx.put('meta', { key: 'schemaVersion', value: SCHEMA_VERSION });
      return { schemaVersion: SCHEMA_VERSION, migrated: true };
    });
  }

  async hasAnyUser(): Promise<boolean> {
    return this.backend.readTx(['users'], async tx => {
      const users = await tx.getAll<LocalUser>('users');
      return users.length > 0;
    });
  }

  /* --------------------- Session active persistée --------------------- */

  /**
   * Jeton de session actif stocké dans IndexedDB (store meta).
   * La localStorage reste réservée aux préférences non sensibles.
   */
  async getActiveSessionToken(): Promise<string | null> {
    return this.backend.readTx(['meta'], async tx => {
      const record = await tx.get<{ key: string; value: string | null }>('meta', 'activeSessionToken');
      return record?.value ?? null;
    });
  }

  private async setActiveSessionToken(tx: StorageTx, token: string | null): Promise<void> {
    await tx.put('meta', { key: 'activeSessionToken', value: token });
  }

  /** Restaure la session au démarrage de l'application. */
  async currentSession(): Promise<{ user: LocalUser; organization: Organization } | null> {
    const token = await this.getActiveSessionToken();
    if (!token) return null;
    const result = await this.getSession(token);
    if (!result) {
      await this.backend.writeTx(['meta'], tx => this.setActiveSessionToken(tx, null));
      return null;
    }
    return result;
  }

  /* ------------------------------ Auth ------------------------------ */

  async registerUser(input: RegisterInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    const fullName = input.fullName.trim();
    const companyName = input.companyName.trim();

    if (!fullName || !email || !companyName) {
      throw new Error('Tous les champs obligatoires doivent être renseignés.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Adresse e-mail invalide.');
    }
    if (!input.password || input.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
    }

    const saltHex = await randomHex(16);
    const passwordHash = await hashPassword(input.password, saltHex);
    const createdAt = new Date().toISOString();

    return this.backend.writeTx(ALL_STORES, async tx => {
      const users = await tx.getAll<LocalUser>('users');
      if (users.some(u => u.email === email)) {
        throw new Error('Un compte existe déjà avec cette adresse e-mail.');
      }

      const organization: Organization = {
        id: newId('org'),
        name: companyName,
        defaultCurrency: DEFAULT_CURRENCY,
        createdAt,
      };
      const user: LocalUser = {
        id: newId('user'),
        email,
        fullName,
        organizationId: organization.id,
        role: 'owner',
        saltHex,
        passwordHash,
        createdAt,
      };

      const settings: SettingsRecord = {
        organizationId: organization.id,
        defaultCurrency: DEFAULT_CURRENCY,
        onboarding: {
          hasConfiguredCompany: true,
          hasImportedFile: false,
          hasReviewedPriorities: false,
          hasTakenAction: false,
        },
      };

      await tx.put('organizations', organization);
      await tx.put('users', user);
      await tx.put('settings', settings);
      await this.putHistory(tx, organization.id, {
        entityType: 'settings',
        entityId: organization.id,
        event: 'organization_created',
        summary: `Organisation « ${companyName} » créée`,
      });

      const token = await this.issueSession(tx, user);
      return {
        user: this.publicUser(user),
        token,
        organization,
      };
    });
  }

  async login(emailInput: string, password: string): Promise<AuthResult> {
    const email = normalizeEmail(emailEmailGuard(emailInput));
    if (!password) {
      throw new Error('Mot de passe requis.');
    }

    return this.backend.writeTx(ALL_STORES, async tx => {
      const users = await tx.getAllByIndex<LocalUser>('users', 'email', email);
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Identifiants incorrects.');
      }
      const candidate = await hashPassword(password, user.saltHex);
      if (candidate !== user.passwordHash) {
        throw new Error('Identifiants incorrects.');
      }
      const organization = await tx.get<Organization>('organizations', user.organizationId);
      if (!organization) {
        throw new Error('Organisation introuvable pour ce compte.');
      }
      const token = await this.issueSession(tx, user);
      return { user: this.publicUser(user), token, organization };
    });
  }

  async logout(token: string): Promise<void> {
    await this.backend.writeTx(['sessions', 'meta'], async tx => {
      const session = await tx.get<SessionRecord>('sessions', token);
      if (session) {
        await tx.delete('sessions', token);
      }
      const active = await tx.get<{ key: string; value: string | null }>('meta', 'activeSessionToken');
      if (active?.value === token) {
        await this.setActiveSessionToken(tx, null);
      }
    });
  }

  async getSession(token: string | null): Promise<{ user: LocalUser; organization: Organization } | null> {
    if (!token) return null;
    return this.backend.readTx(['sessions', 'users', 'organizations'], async tx => {
      const session = await tx.get<SessionRecord>('sessions', token);
      if (!session) return null;
      if (session.expiresAt < Date.now()) {
        return null;
      }
      const user = await tx.get<LocalUser>('users', session.userId);
      if (!user) return null;
      const organization = await tx.get<Organization>('organizations', session.organizationId);
      if (!organization) return null;
      return { user, organization };
    });
  }

  private async issueSession(tx: StorageTx, user: LocalUser): Promise<string> {
    const token = `rr_${await randomHex(24)}`;
    const session: SessionRecord = {
      token,
      userId: user.id,
      organizationId: user.organizationId,
      active: true,
      expiresAt: Date.now() + SESSION_TTL_MS,
      createdAt: new Date().toISOString(),
    };
    // Une seule session active par utilisateur.
    const existing = await tx.getAllByIndex<SessionRecord>('sessions', 'userId', user.id);
    for (const old of existing) {
      await tx.delete('sessions', old.token);
    }
    await tx.put('sessions', session);
    await this.setActiveSessionToken(tx, token);
    return token;
  }

  private publicUser(user: LocalUser): Omit<LocalUser, 'passwordHash' | 'saltHex'> {
    const { passwordHash: _ph, saltHex: _sh, ...rest } = user;
    void _ph;
    void _sh;
    return rest;
  }

  /* ---------------------------- Journal ----------------------------- */

  private async putHistory(
    tx: StorageTx,
    organizationId: string,
    entry: Omit<HistoryEntry, 'id' | 'organizationId' | 'at'>
  ): Promise<void> {
    await tx.put('history', {
      id: newId('hist'),
      organizationId,
      at: new Date().toISOString(),
      ...entry,
    } satisfies HistoryEntry);
  }

  async listHistory(organizationId: string, limit = 200): Promise<HistoryEntry[]> {
    return this.backend.readTx(['history'], async tx => {
      const all = await tx.getAllByIndex<HistoryEntry>('history', 'organizationId', organizationId);
      return all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
    });
  }

  /* --------------------------- Factures ----------------------------- */

  /**
   * Liste les factures avec recalcul des champs dérivés à la volée
   * (retard, tranche d'aging, score) — aucune valeur figée stockée.
   */
  async listInvoices(organizationId: string, asOfDate = todayISO()): Promise<InvoiceRecord[]> {
    const { invoices, paidByInvoice, openPromises, brokenPromises } = await this.loadGraph(organizationId);
    const enriched = invoices.map(inv => {
      const paid = roundMoney(paidByInvoice.get(inv.id) ?? 0);
      const record: InvoiceRecord = {
        ...inv,
        paidAmount: paid,
        outstandingAmount: roundMoney(Math.max(0, inv.totalAmount - paid)),
        promisedPaymentDate: openPromises.get(inv.id)?.promisedDate ?? inv.promisedPaymentDate,
      };
      return withDerivedFields(record, {
        portfolioOutstanding: 0,
        asOfDate,
        openPromiseIds: openPromises.has(inv.id) ? new Set([inv.id]) : new Set(),
        brokenPromiseIds: brokenPromises.has(inv.id) ? new Set([inv.id]) : new Set(),
      });
    });

    // Deuxième passe : concentration calculée sur le portefeuille réel.
    const portfolio = enriched.reduce((acc, inv) => acc + (inv.status === 'paid' ? 0 : inv.outstandingAmount), 0);
    return enriched.map(inv =>
      withDerivedFields(inv, {
        portfolioOutstanding: portfolio,
        asOfDate,
        openPromiseIds: openPromises.has(inv.id) ? new Set([inv.id]) : new Set(),
        brokenPromiseIds: brokenPromises.has(inv.id) ? new Set([inv.id]) : new Set(),
      })
    );
  }

  private async loadGraph(organizationId: string) {
    return this.backend.readTx(
      ['invoices', 'payments', 'promises', 'disputes'],
      async tx => {
        const invoices = await tx.getAllByIndex<StoredInvoice>('invoices', 'organizationId', organizationId);
        const payments = await tx.getAllByIndex<PaymentRecord>('payments', 'organizationId', organizationId);
        const promises = await tx.getAllByIndex<PromiseRecord>('promises', 'organizationId', organizationId);
        const disputes = await tx.getAllByIndex<DisputeRecord>('disputes', 'organizationId', organizationId);

        const paidByInvoice = new Map<string, number>();
        for (const p of payments) {
          paidByInvoice.set(p.invoiceId, roundMoney((paidByInvoice.get(p.invoiceId) ?? 0) + p.amount));
        }

        const today = todayISO();
        const openPromises = new Map<string, PromiseRecord>();
        const brokenPromises = new Map<string, PromiseRecord[]>();
        for (const p of promises) {
          if (p.status === 'open') {
            const overduePromise = parseDateInput(p.promisedDate);
            const isBroken = overduePromise.ok && overduePromise.iso < today;
            if (isBroken) {
              const list = brokenPromises.get(p.invoiceId) ?? [];
              list.push(p);
              brokenPromises.set(p.invoiceId, list);
            } else {
              openPromises.set(p.invoiceId, p);
            }
          }
        }

        const openDisputes = new Map<string, DisputeRecord>();
        for (const d of disputes) {
          if (d.status === 'open') openDisputes.set(d.invoiceId, d);
        }

        return {
          invoices: invoices.map(inv => {
            const dispute = openDisputes.get(inv.id);
            return dispute ? { ...inv, status: 'disputed' as const, disputeReason: dispute.reason } : inv;
          }) as StoredInvoice[],
          paidByInvoice,
          openPromises,
          brokenPromises: new Map(Array.from(brokenPromises.entries()).map(([k, v]) => [k, v])),
          openDisputes,
        };
      }
    );
  }

  async importInvoices(
    organizationId: string,
    invoices: InvoiceRecord[],
    mode: ImportMode,
    defaultCurrency = DEFAULT_CURRENCY
  ): Promise<ImportResult> {
    const today = todayISO();
    const createdAt = new Date().toISOString();

    return this.backend.writeTx(ALL_STORES, async tx => {
      const existing = await tx.getAllByIndex<StoredInvoice>('invoices', 'organizationId', organizationId);
      const byNumber = new Map(existing.map(inv => [inv.invoiceNumber, inv]));

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let rejected = 0;

      if (mode === 'replace') {
        for (const inv of existing) {
          await tx.delete('invoices', inv.id);
        }
        byNumber.clear();
      }

      for (const candidate of invoices) {
        const errors = validateInvoiceRecord(candidate);
        if (errors.length > 0) {
          rejected++;
          continue;
        }

        const prior = byNumber.get(candidate.invoiceNumber);
        const id = prior?.id ?? candidate.id ?? newId('inv');
        const record: StoredInvoice = {
          ...candidate,
          id,
          organizationId,
          currency: (candidate.currency || defaultCurrency).toUpperCase(),
          paidAmount: 0,
        };

        if (prior && mode === 'merge') {
          skipped++;
          continue;
        }

        await tx.put('invoices', record);
        byNumber.set(record.invoiceNumber, record);
        if (prior) updated++;
        else inserted++;

        // Le journal des encaissements devient la source de vérité :
        // le solde réglé déjà constaté à l'import est enregistré en écriture initiale.
        if (candidate.paidAmount > 0) {
          await tx.put('payments', {
            id: newId('pay'),
            organizationId,
            invoiceId: id,
            amount: roundMoney(candidate.paidAmount),
            currency: record.currency,
            paidDate: candidate.issueDate || today,
            reference: 'Solde initial constaté à l\'import',
            baseline: true,
            createdAt,
          } satisfies PaymentRecord);
        }
      }

      await this.putHistory(tx, organizationId, {
        entityType: 'import',
        entityId: mode,
        event: 'import_committed',
        summary: `Import ${mode} : ${inserted} ajoutée(s), ${updated} mise(s) à jour, ${skipped} ignorée(s), ${rejected} rejetée(s)`,
      });

      const settings = await tx.get<SettingsRecord>('settings', organizationId);
      if (settings && inserted + updated > 0 && !settings.onboarding.hasImportedFile) {
        await tx.put('settings', {
          ...settings,
          onboarding: { ...settings.onboarding, hasImportedFile: true },
        });
      }

      return { inserted, updated, skipped, rejected, mode };
    });
  }

  /* -------------------------- Encaissements -------------------------- */

  async recordPayment(
    organizationId: string,
    invoiceId: string,
    input: { amount: number; paidDate: string; reference: string }
  ): Promise<InvoiceRecord> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('Le montant encaissé doit être supérieur à zéro.');
    }
    const dateCheck = parseDateInput(input.paidDate);
    if (!dateCheck.ok) {
      throw new Error(`Date d'encaissement invalide : ${dateCheck.reason}`);
    }

    return this.backend.writeTx(ALL_STORES, async tx => {
      const invoice = await tx.get<StoredInvoice>('invoices', invoiceId);
      if (!invoice || invoice.organizationId !== organizationId) {
        throw new Error('Facture introuvable dans cette organisation.');
      }
      const payments = await tx.getAllByIndex<PaymentRecord>('payments', 'invoiceId', invoiceId);
      const alreadyPaid = payments.reduce((acc, p) => acc + p.amount, 0);
      const outstanding = roundMoney(invoice.totalAmount - alreadyPaid);
      if (input.amount > outstanding + 0.001) {
        throw new Error(
          `Le montant (${input.amount}) dépasse l'encours restant (${outstanding}).`
        );
      }

      const payment: PaymentRecord = {
        id: newId('pay'),
        organizationId,
        invoiceId,
        amount: roundMoney(input.amount),
        currency: invoice.currency,
        paidDate: dateCheck.iso,
        reference: input.reference.trim() || 'Virement / versement',
        baseline: false,
        createdAt: new Date().toISOString(),
      };
      await tx.put('payments', payment);

      const newPaid = roundMoney(alreadyPaid + input.amount);
      const newOutstanding = roundMoney(Math.max(0, invoice.totalAmount - newPaid));
      await tx.put('invoices', {
        ...invoice,
        paidAmount: newPaid,
        outstandingAmount: newOutstanding,
        status: newOutstanding <= 0 ? 'paid' : invoice.status === 'disputed' ? 'disputed' : invoice.status,
      });

      await this.putHistory(tx, organizationId, {
        entityType: 'payment',
        entityId: payment.id,
        event: 'payment_recorded',
        summary: `Encaissement de ${input.amount} sur ${invoice.invoiceNumber} (${payment.reference})`,
      });

      return { ...invoice, paidAmount: newPaid, outstandingAmount: newOutstanding };
    });
  }

  /* ---------------------------- Promesses ---------------------------- */

  async recordPromise(
    organizationId: string,
    invoiceId: string,
    input: { promisedDate: string; notes: string }
  ): Promise<void> {
    const dateCheck = parseDateInput(input.promisedDate);
    if (!dateCheck.ok) {
      throw new Error(`Date de promesse invalide : ${dateCheck.reason}`);
    }

    return this.backend.writeTx(ALL_STORES, async tx => {
      const invoice = await tx.get<StoredInvoice>('invoices', invoiceId);
      if (!invoice || invoice.organizationId !== organizationId) {
        throw new Error('Facture introuvable dans cette organisation.');
      }
      const promises: PromiseRecord = {
        id: newId('pr'),
        organizationId,
        invoiceId,
        promisedDate: dateCheck.iso,
        notes: input.notes.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      await tx.put('promises', promises);
      await tx.put('invoices', { ...invoice, promisedPaymentDate: dateCheck.iso });

      await this.putHistory(tx, organizationId, {
        entityType: 'promise',
        entityId: promises.id,
        event: 'promise_recorded',
        summary: `Promesse de règlement au ${dateCheck.iso} sur ${invoice.invoiceNumber}`,
      });
    });
  }

  async setPromiseStatus(organizationId: string, promiseId: string, status: PromiseStatus): Promise<void> {
    await this.backend.writeTx(ALL_STORES, async tx => {
      const promise = await tx.get<PromiseRecord>('promises', promiseId);
      if (!promise || promise.organizationId !== organizationId) {
        throw new Error('Promesse introuvable.');
      }
      await tx.put('promises', {
        ...promise,
        status,
        closedAt: status === 'open' ? undefined : new Date().toISOString(),
      });
      await this.putHistory(tx, organizationId, {
        entityType: 'promise',
        entityId: promiseId,
        event: `promise_${status}`,
        summary: `Promesse marquée « ${status === 'kept' ? 'tenue' : status === 'broken' ? 'rompue' : 'ouverte'} »`,
      });
    });
  }

  async listPromises(organizationId: string): Promise<PromiseRecord[]> {
    return this.backend.readTx(['promises'], async tx =>
      tx.getAllByIndex<PromiseRecord>('promises', 'organizationId', organizationId)
    );
  }

  /* ----------------------------- Litiges ----------------------------- */

  async setDispute(
    organizationId: string,
    invoiceId: string,
    disputed: boolean,
    reason = ''
  ): Promise<void> {
    await this.backend.writeTx(ALL_STORES, async tx => {
      const invoice = await tx.get<StoredInvoice>('invoices', invoiceId);
      if (!invoice || invoice.organizationId !== organizationId) {
        throw new Error('Facture introuvable dans cette organisation.');
      }
      const disputes = await tx.getAllByIndex<DisputeRecord>('disputes', 'invoiceId', invoiceId);

      if (disputed) {
        const record: DisputeRecord = {
          id: newId('disp'),
          organizationId,
          invoiceId,
          reason: reason.trim() || 'Litige commercial déclaré',
          status: 'open',
          createdAt: new Date().toISOString(),
        };
        await tx.put('disputes', record);
        await tx.put('invoices', { ...invoice, status: 'disputed', disputeReason: record.reason });
        await this.putHistory(tx, organizationId, {
          entityType: 'dispute',
          entityId: record.id,
          event: 'dispute_opened',
          summary: `Litige ouvert sur ${invoice.invoiceNumber}`,
        });
      } else {
        for (const d of disputes.filter(x => x.status === 'open')) {
          await tx.put('disputes', { ...d, status: 'resolved', resolvedAt: new Date().toISOString() });
        }
        const outstanding = roundMoney(invoice.totalAmount - invoice.paidAmount);
        const nextStatus: InvoiceRecord['status'] =
          outstanding <= 0 ? 'paid' : invoice.daysPastDue > 0 ? 'overdue' : 'current';
        await tx.put('invoices', { ...invoice, status: nextStatus, disputeReason: undefined });
        await this.putHistory(tx, organizationId, {
          entityType: 'dispute',
          entityId: invoiceId,
          event: 'dispute_resolved',
          summary: `Litige clos sur ${invoice.invoiceNumber}`,
        });
      }
    });
  }

  /* ------------------------- Actions / relances ---------------------- */

  async saveAction(organizationId: string, action: Omit<ActionRecord, 'id' | 'organizationId' | 'createdAt'>): Promise<ActionRecord> {
    return this.backend.writeTx(ALL_STORES, async tx => {
      const record: ActionRecord = {
        id: newId('act'),
        organizationId,
        createdAt: new Date().toISOString(),
        ...action,
      };
      await tx.put('actions', record);
      await this.putHistory(tx, organizationId, {
        entityType: 'action',
        entityId: record.id,
        event: 'action_logged',
        summary: `Action « ${record.actionType} » enregistrée sur ${record.invoiceNumber}`,
      });
      const settings = await tx.get<SettingsRecord>('settings', organizationId);
      if (settings && !settings.onboarding.hasTakenAction) {
        await tx.put('settings', {
          ...settings,
          onboarding: { ...settings.onboarding, hasTakenAction: true },
        });
      }
      return record;
    });
  }

  async listActions(organizationId: string): Promise<ActionRecord[]> {
    return this.backend.readTx(['actions'], async tx => {
      const all = await tx.getAllByIndex<ActionRecord>('actions', 'organizationId', organizationId);
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  /* ---------------------------- Paramètres --------------------------- */

  async getSettings(organizationId: string): Promise<SettingsRecord> {
    return this.backend.readTx(['settings'], async tx => {
      const found = await tx.get<SettingsRecord>('settings', organizationId);
      return (
        found ?? {
          organizationId,
          defaultCurrency: DEFAULT_CURRENCY,
          onboarding: {
            hasConfiguredCompany: true,
            hasImportedFile: false,
            hasReviewedPriorities: false,
            hasTakenAction: false,
          },
        }
      );
    });
  }

  async saveSettings(organizationId: string, patch: Partial<SettingsRecord>): Promise<SettingsRecord> {
    return this.backend.writeTx(['settings', 'history'], async tx => {
      const current = await tx.get<SettingsRecord>('settings', organizationId);
      const next: SettingsRecord = {
        organizationId,
        defaultCurrency: patch.defaultCurrency ?? current?.defaultCurrency ?? DEFAULT_CURRENCY,
        creditSales90d: patch.creditSales90d ?? current?.creditSales90d,
        onboarding: { ...(current?.onboarding ?? { hasConfiguredCompany: true, hasImportedFile: false, hasReviewedPriorities: false, hasTakenAction: false }), ...(patch.onboarding ?? {}) },
      };
      await tx.put('settings', next);
      await this.putHistory(tx, organizationId, {
        entityType: 'settings',
        entityId: organizationId,
        event: 'settings_updated',
        summary: 'Paramètres du workspace mis à jour',
      });
      return next;
    });
  }

  /* ------------------------------ Licence ---------------------------- */

  async getLicense(): Promise<LicenseInfo | null> {
    return this.backend.readTx(['meta'], async tx => {
      const record = await tx.get<{ key: string; value: LicenseInfo }>('meta', 'license');
      return record?.value ?? null;
    });
  }

  async saveLicense(license: LicenseInfo): Promise<void> {
    await this.backend.writeTx(['meta', 'history'], async tx => {
      await tx.put('meta', { key: 'license', value: license } as never);
      await this.putHistory(tx, 'system', {
        entityType: 'license',
        entityId: license.key,
        event: 'license_activated',
        summary: `Licence ${license.plan} activée localement`,
      });
    });
  }

  /* ---------------------------- Intégrité ---------------------------- */

  /**
   * Vérification d'intégrité : cohérence des totaux, unicité des numéros,
   * intégrité référentielle entre factures, encaissements, promesses et litiges.
   */
  async verifyIntegrity(organizationId: string): Promise<IntegrityReport> {
    const { invoices, payments, promises, disputes } = await this.backend.readTx(
      ['invoices', 'payments', 'promises', 'disputes'],
      async tx => ({
        invoices: await tx.getAllByIndex<StoredInvoice>('invoices', 'organizationId', organizationId),
        payments: await tx.getAllByIndex<PaymentRecord>('payments', 'organizationId', organizationId),
        promises: await tx.getAllByIndex<PromiseRecord>('promises', 'organizationId', organizationId),
        disputes: await tx.getAllByIndex<DisputeRecord>('disputes', 'organizationId', organizationId),
      })
    );
    const issues: IntegrityIssue[] = [];
    const invoiceIds = new Set(invoices.map(i => i.id));
    const numbers = new Set<string>();

    for (const inv of invoices) {
      if (inv.organizationId !== organizationId) {
        issues.push({ code: 'tenant_leak', severity: 'error', entityId: inv.id, message: `Facture ${inv.id} appartenant à une autre organisation.` });
      }
      if (numbers.has(inv.invoiceNumber)) {
        issues.push({ code: 'duplicate_number', severity: 'error', entityId: inv.id, message: `Numéro dupliqué : ${inv.invoiceNumber}` });
      }
      numbers.add(inv.invoiceNumber);
      if (inv.totalAmount < 0 || inv.paidAmount < 0) {
        issues.push({ code: 'negative_amount', severity: 'error', entityId: inv.id, message: `Montant négatif sur ${inv.invoiceNumber}` });
      }
      if (inv.paidAmount > inv.totalAmount + 0.001) {
        issues.push({ code: 'overpaid', severity: 'error', entityId: inv.id, message: `Réglé supérieur au total sur ${inv.invoiceNumber}` });
      }
    }

    for (const p of payments) {
      if (!invoiceIds.has(p.invoiceId)) {
        issues.push({ code: 'orphan_payment', severity: 'error', entityId: p.id, message: `Encaissement orphelin ${p.id}` });
      }
      if (p.amount <= 0) {
        issues.push({ code: 'invalid_payment', severity: 'error', entityId: p.id, message: `Montant d'encaissement invalide ${p.id}` });
      }
    }
    for (const pr of promises) {
      if (!invoiceIds.has(pr.invoiceId)) {
        issues.push({ code: 'orphan_promise', severity: 'error', entityId: pr.id, message: `Promesse orpheline ${pr.id}` });
      }
      if (!parseDateInput(pr.promisedDate).ok) {
        issues.push({ code: 'invalid_promise_date', severity: 'error', entityId: pr.id, message: `Date de promesse illisible ${pr.id}` });
      }
    }
    for (const d of disputes) {
      if (!invoiceIds.has(d.invoiceId)) {
        issues.push({ code: 'orphan_dispute', severity: 'error', entityId: d.id, message: `Litige orphelin ${d.id}` });
      }
    }

    return { ok: issues.every(i => i.severity !== 'error'), checkedInvoices: invoices.length, issues };
  }

  /* ----------------------------- Accès brut --------------------------- */

  async readAllForBackup(organizationId: string) {
    return this.backend.readTx(ALL_STORES, async tx => {
      const org = await tx.get<Organization>('organizations', organizationId);
      const users = (await tx.getAll<LocalUser>('users')).filter(u => u.organizationId === organizationId);
      const settings = await tx.get<SettingsRecord>('settings', organizationId);
      const invoices = await tx.getAllByIndex<StoredInvoice>('invoices', 'organizationId', organizationId);
      const payments = await tx.getAllByIndex<PaymentRecord>('payments', 'organizationId', organizationId);
      const promises = await tx.getAllByIndex<PromiseRecord>('promises', 'organizationId', organizationId);
      const disputes = await tx.getAllByIndex<DisputeRecord>('disputes', 'organizationId', organizationId);
      const actions = await tx.getAllByIndex<ActionRecord>('actions', 'organizationId', organizationId);
      const history = await tx.getAllByIndex<HistoryEntry>('history', 'organizationId', organizationId);
      const license = await tx.get<{ key: string; value: LicenseInfo }>('meta', 'license');
      return { org, users, settings, invoices, payments, promises, disputes, actions, history, license: license?.value ?? null };
    });
  }

  /** Remplace l'intégralité des données d'une organisation (restauration). */
  async replaceOrganizationData(
    organizationId: string,
    data: {
      invoices: InvoiceRecord[];
      payments: PaymentRecord[];
      promises: PromiseRecord[];
      disputes: DisputeRecord[];
      actions: ActionRecord[];
      history: HistoryEntry[];
      settings?: SettingsRecord;
    },
    meta: { label: string }
  ): Promise<void> {
    await this.backend.writeTx(ALL_STORES, async tx => {
      for (const inv of await tx.getAllByIndex<StoredInvoice>('invoices', 'organizationId', organizationId)) {
        await tx.delete('invoices', inv.id);
      }
      for (const p of await tx.getAllByIndex<PaymentRecord>('payments', 'organizationId', organizationId)) {
        await tx.delete('payments', p.id);
      }
      for (const p of await tx.getAllByIndex<PromiseRecord>('promises', 'organizationId', organizationId)) {
        await tx.delete('promises', p.id);
      }
      for (const d of await tx.getAllByIndex<DisputeRecord>('disputes', 'organizationId', organizationId)) {
        await tx.delete('disputes', d.id);
      }
      for (const a of await tx.getAllByIndex<ActionRecord>('actions', 'organizationId', organizationId)) {
        await tx.delete('actions', a.id);
      }

      for (const inv of data.invoices) await tx.put('invoices', { ...inv, organizationId });
      for (const p of data.payments) await tx.put('payments', { ...p, organizationId });
      for (const p of data.promises) await tx.put('promises', { ...p, organizationId });
      for (const d of data.disputes) await tx.put('disputes', { ...d, organizationId });
      for (const a of data.actions) await tx.put('actions', { ...a, organizationId });
      for (const h of data.history.slice(-500)) await tx.put('history', { ...h, organizationId });
      if (data.settings) await tx.put('settings', { ...data.settings, organizationId });

      await this.putHistory(tx, organizationId, {
        entityType: 'backup',
        entityId: 'restore',
        event: 'backup_restored',
        summary: `Restauration effectuée : ${meta.label}`,
      });
    });
  }

  /** Fusion (sans écrasement) d'une sauvegarde. */
  async mergeOrganizationData(
    organizationId: string,
    data: {
      invoices: InvoiceRecord[];
      payments: PaymentRecord[];
      promises: PromiseRecord[];
      disputes: DisputeRecord[];
      actions: ActionRecord[];
    },
    meta: { label: string }
  ): Promise<{ inserted: number; skipped: number }> {
    return this.backend.writeTx(ALL_STORES, async tx => {
      const existingInvoices = await tx.getAllByIndex<StoredInvoice>('invoices', 'organizationId', organizationId);
      const existingNumbers = new Set(existingInvoices.map(i => i.invoiceNumber));
      const existingPayments = await tx.getAllByIndex<PaymentRecord>('payments', 'organizationId', organizationId);
      const paymentKeys = new Set(existingPayments.map(p => `${p.invoiceId}:${p.amount}:${p.paidDate}`));

      let inserted = 0;
      let skipped = 0;
      const idMapping = new Map<string, string>();

      for (const inv of data.invoices) {
        if (existingNumbers.has(inv.invoiceNumber)) {
          const match = existingInvoices.find(i => i.invoiceNumber === inv.invoiceNumber)!;
          idMapping.set(inv.id, match.id);
          skipped++;
          continue;
        }
        const newInvoiceId = newId('inv');
        idMapping.set(inv.id, newInvoiceId);
        await tx.put('invoices', { ...inv, id: newInvoiceId, organizationId });
        existingNumbers.add(inv.invoiceNumber);
        inserted++;
      }

      for (const p of data.payments) {
        const targetInvoice = idMapping.get(p.invoiceId);
        if (!targetInvoice) continue;
        const key = `${targetInvoice}:${p.amount}:${p.paidDate}`;
        if (paymentKeys.has(key)) continue;
        await tx.put('payments', { ...p, id: newId('pay'), invoiceId: targetInvoice, organizationId });
        paymentKeys.add(key);
      }

      for (const p of data.promises) {
        const target = idMapping.get(p.invoiceId);
        if (!target) continue;
        await tx.put('promises', { ...p, id: newId('pr'), invoiceId: target, organizationId });
      }

      for (const d of data.disputes) {
        const target = idMapping.get(d.invoiceId);
        if (!target) continue;
        await tx.put('disputes', { ...d, id: newId('disp'), invoiceId: target, organizationId });
      }

      for (const a of data.actions) {
        const target = idMapping.get(a.invoiceId);
        if (!target) continue;
        await tx.put('actions', { ...a, id: newId('act'), invoiceId: target, organizationId });
      }

      await this.putHistory(tx, organizationId, {
        entityType: 'backup',
        entityId: 'merge',
        event: 'backup_merged',
        summary: `Fusion de sauvegarde : ${inserted} ajoutée(s), ${skipped} déjà présente(s) — ${meta.label}`,
      });

      return { inserted, skipped };
    });
  }
}

function emailEmailGuard(email: string): string {
  if (!email || !email.trim()) {
    throw new Error('Adresse e-mail requise.');
  }
  return email.trim();
}

export { ALL_STORES };
