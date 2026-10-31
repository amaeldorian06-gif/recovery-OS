import { InvoiceRecord } from '../types';

/** Version du schéma persistant. Tout changement de structure impose une migration. */
export const SCHEMA_VERSION = 1;

export const DB_NAME = 'revenue-recovery-os-v1';

export type StoreName =
  | 'meta'
  | 'organizations'
  | 'users'
  | 'sessions'
  | 'invoices'
  | 'payments'
  | 'promises'
  | 'disputes'
  | 'actions'
  | 'history'
  | 'settings';

/** Entité facture telle que persistée (toujours rattachée à une organisation). */
export interface StoredInvoice extends InvoiceRecord {
  organizationId: string;
}

export type UserRole = 'owner' | 'finance_manager' | 'collector';

export interface Organization {
  id: string;
  name: string;
  defaultCurrency: string;
  createdAt: string;
}

export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: UserRole;
  saltHex: string;
  passwordHash: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  organizationId: string;
  active: boolean;
  expiresAt: number;
  createdAt: string;
}

/** Journal d'encaissements — source de vérité des montants réglés. */
export interface PaymentRecord {
  id: string;
  organizationId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paidDate: string;
  reference: string;
  baseline: boolean;
  createdAt: string;
}

export type PromiseStatus = 'open' | 'kept' | 'broken';

export interface PromiseRecord {
  id: string;
  organizationId: string;
  invoiceId: string;
  promisedDate: string;
  notes: string;
  status: PromiseStatus;
  createdAt: string;
  closedAt?: string;
}

export interface DisputeRecord {
  id: string;
  organizationId: string;
  invoiceId: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface ActionRecord {
  id: string;
  organizationId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  actionType: string;
  tone: 'courteous' | 'firm' | 'formal' | 'legal';
  subject: string;
  body: string;
  recipient: string;
  outcome: string;
  followUpDate?: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  organizationId: string;
  entityType: 'invoice' | 'payment' | 'promise' | 'dispute' | 'action' | 'import' | 'backup' | 'license' | 'settings';
  entityId: string;
  event: string;
  summary: string;
  at: string;
}

export interface SettingsRecord {
  organizationId: string;
  defaultCurrency: string;
  creditSales90d?: number;
  onboarding: {
    hasConfiguredCompany: boolean;
    hasImportedFile: boolean;
    hasReviewedPriorities: boolean;
    hasTakenAction: boolean;
  };
}

export type LicensePlan = 'trial' | 'essentiel' | 'pro' | 'cabinet';

export interface LicenseInfo {
  key: string;
  plan: LicensePlan;
  label: string;
  seats: number;
  activatedAt: string;
  /** Protection locale de confort — pas un contrôle serveur (documenté côté UI). */
  verification: 'locale';
}

/** Agrégat d'une facture enrichi de son journal. */
export interface InvoiceAggregate extends InvoiceRecord {
  paymentCount: number;
  openPromiseId?: string;
  brokenPromiseIds: string[];
  openDisputeId?: string;
}

export interface IntegrityIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  entityId?: string;
}

export interface IntegrityReport {
  ok: boolean;
  checkedInvoices: number;
  issues: IntegrityIssue[];
}
