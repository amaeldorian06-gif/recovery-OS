import { InvoiceRecord } from '../types';
import { getCuratedSampleInvoices } from '../data/sampleReceivables';
import { sanitizeCsvCell } from '../utils/csv';

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: 'owner' | 'finance_manager' | 'collector';
  passwordHash: string; // In production, bcrypt hash
}

export interface Session {
  token: string;
  userId: string;
  organizationId: string;
  expiresAt: number;
}

export interface OnboardingState {
  hasConfiguredCompany: boolean;
  hasImportedFile: boolean;
  hasReviewedPriorities: boolean;
  hasTakenAction: boolean;
}

// Initial Authoritative Seed Users & Organizations
export const SEED_USERS: User[] = [
  {
    id: 'user-acme-1',
    email: 'sarah@acme-consulting.com',
    name: 'Sarah Chen (Owner)',
    organizationId: 'org-acme',
    organizationName: 'Acme Advisory Group',
    role: 'owner',
    passwordHash: 'hashed_secret_acme_2026',
  },
  {
    id: 'user-acme-2',
    email: 'mike@acme-consulting.com',
    name: 'Mike Ross (Collector)',
    organizationId: 'org-acme',
    organizationName: 'Acme Advisory Group',
    role: 'collector',
    passwordHash: 'hashed_secret_mike_2026',
  },
  {
    id: 'user-strata-1',
    email: 'elena@strata-media.com',
    name: 'Elena Rostova (Owner)',
    organizationId: 'org-strata',
    organizationName: 'Strata Media Partners',
    role: 'owner',
    passwordHash: 'hashed_secret_strata_2026',
  },
];

// Multi-Tenant Authoritative Invoice & Auth Store
class MultiTenantStore {
  private users: User[] = [...SEED_USERS];
  private invoicesByOrg: Map<string, InvoiceRecord[]> = new Map();
  private sessions: Map<string, Session> = new Map();
  private onboardingByOrg: Map<string, OnboardingState> = new Map();

  constructor() {
    // Seed Acme with sample receivables
    const acmeInvoices = getCuratedSampleInvoices().map(inv => ({
      ...inv,
      id: `acme-${inv.id}`,
    }));
    this.invoicesByOrg.set('org-acme', acmeInvoices);
    this.onboardingByOrg.set('org-acme', {
      hasConfiguredCompany: true,
      hasImportedFile: true,
      hasReviewedPriorities: true,
      hasTakenAction: true,
    });

    // Seed Strata with completely isolated receivables
    this.invoicesByOrg.set('org-strata', [
      {
        id: 'strata-inv-1',
        invoiceNumber: 'STR-2026-101',
        customerName: 'Nordic Tech Media',
        customerEmail: 'billing@nordicmedia.se',
        issueDate: '2026-08-10',
        dueDate: '2026-09-10',
        totalAmount: 48000,
        paidAmount: 0,
        outstandingAmount: 48000,
        currency: 'EUR',
        status: 'overdue',
        daysPastDue: 49,
        agingBucket: '31-60',
        riskScore: 72,
        riskTier: 'High',
        riskFactors: ['Delinquent 31-60 days (+28 pts)', 'High concentration risk (+25 pts: 65% of portfolio)'],
        notes: 'Strata media production contract balance.',
      },
      {
        id: 'strata-inv-2',
        invoiceNumber: 'STR-2026-102',
        customerName: 'Baltic Audio Works',
        customerEmail: 'payables@balticaudio.io',
        issueDate: '2026-09-20',
        dueDate: '2026-10-20',
        totalAmount: 25000,
        paidAmount: 5000,
        outstandingAmount: 20000,
        currency: 'EUR',
        status: 'overdue',
        daysPastDue: 9,
        agingBucket: '1-30',
        riskScore: 35,
        riskTier: 'Medium',
        riskFactors: ['Delinquent 1-30 days (+15 pts)'],
        notes: 'Audio mastering installment.',
      },
    ]);
    this.onboardingByOrg.set('org-strata', {
      hasConfiguredCompany: true,
      hasImportedFile: true,
      hasReviewedPriorities: true,
      hasTakenAction: false,
    });
  }

  // User Management
  getAllUsers(): User[] {
    return [...this.users];
  }

  findUserByEmail(email: string): User | null {
    const normalized = email.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === normalized) || null;
  }

  registerUserAndTenant(payload: {
    fullName: string;
    email: string;
    companyName: string;
    password: string;
  }): { user: User; session: Session } {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (!normalizedEmail || !payload.fullName || !payload.companyName || !payload.password) {
      throw new Error('Tous les champs obligatoires doivent être renseignés.');
    }

    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error('Un compte avec cette adresse email existe déjà.');
    }

    const orgSlug = payload.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'company';
    const orgId = `org-${orgSlug}-${Date.now().toString(36)}`;
    const userId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      name: payload.fullName.trim(),
      organizationId: orgId,
      organizationName: payload.companyName.trim(),
      role: 'owner',
      passwordHash: `hash_${payload.password}_secure`,
    };

    this.users.push(newUser);
    this.invoicesByOrg.set(orgId, []);
    this.onboardingByOrg.set(orgId, {
      hasConfiguredCompany: true,
      hasImportedFile: false,
      hasReviewedPriorities: false,
      hasTakenAction: false,
    });

    const session = this.createSession(newUser);
    return { user: newUser, session };
  }

  authenticateUser(email: string, password: string): { user: User; session: Session } {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('Identifiants de connexion invalides. Vérifiez votre email.');
    }

    // In production, bcrypt.compare. Here we strictly verify against user's password hash or demo password
    const expectedHash = `hash_${password}_secure`;
    const isSeedUser = SEED_USERS.some(u => u.id === user.id);
    const isValid =
      user.passwordHash === expectedHash ||
      (isSeedUser && (password === 'demo123' || password === user.passwordHash || password === 'secret2026'));

    if (!isValid) {
      throw new Error('Mot de passe incorrect.');
    }

    const session = this.createSession(user);
    return { user, session };
  }

  // Onboarding Status
  getOnboardingState(organizationId: string): OnboardingState {
    const current = this.onboardingByOrg.get(organizationId);
    if (current) {
      // Cross-check real invoices state
      const invoices = this.invoicesByOrg.get(organizationId) || [];
      if (invoices.length > 0 && !current.hasImportedFile) {
        current.hasImportedFile = true;
      }
      return { ...current };
    }
    return {
      hasConfiguredCompany: true,
      hasImportedFile: false,
      hasReviewedPriorities: false,
      hasTakenAction: false,
    };
  }

  recordOnboardingStep(organizationId: string, step: keyof OnboardingState): OnboardingState {
    const state = this.getOnboardingState(organizationId);
    state[step] = true;
    this.onboardingByOrg.set(organizationId, state);
    return { ...state };
  }

  // Session Management
  createSession(user: User): Session {
    const token = `tok_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const session: Session = {
      token,
      userId: user.id,
      organizationId: user.organizationId,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    };
    this.sessions.set(token, session);
    return session;
  }

  getSession(token: string): { session: Session; user: User } | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    const user = this.users.find(u => u.id === session.userId);
    if (!user) return null;

    return { session, user };
  }

  revokeSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  // Tenant-Isolated Invoices Access
  getInvoices(organizationId: string): InvoiceRecord[] {
    const list = this.invoicesByOrg.get(organizationId) || [];
    return [...list];
  }

  getInvoiceById(organizationId: string, invoiceId: string): InvoiceRecord | null {
    const list = this.invoicesByOrg.get(organizationId) || [];
    return list.find(inv => inv.id === invoiceId) || null;
  }

  saveInvoices(organizationId: string, invoices: InvoiceRecord[]): void {
    // Sanitize any potential formula injection on write
    const sanitized = invoices.map(inv => ({
      ...inv,
      invoiceNumber: sanitizeCsvCell(inv.invoiceNumber),
      customerName: sanitizeCsvCell(inv.customerName),
      customerEmail: sanitizeCsvCell(inv.customerEmail),
      notes: inv.notes ? sanitizeCsvCell(inv.notes) : '',
    }));
    this.invoicesByOrg.set(organizationId, sanitized);

    if (sanitized.length > 0) {
      this.recordOnboardingStep(organizationId, 'hasImportedFile');
    }
  }

  updateInvoice(
    organizationId: string,
    invoiceId: string,
    updater: (existing: InvoiceRecord) => InvoiceRecord
  ): InvoiceRecord | null {
    const list = this.invoicesByOrg.get(organizationId);
    if (!list) return null;

    const idx = list.findIndex(i => i.id === invoiceId);
    if (idx === -1) return null;

    const updated = updater(list[idx]);
    list[idx] = updated;
    this.invoicesByOrg.set(organizationId, list);
    this.recordOnboardingStep(organizationId, 'hasTakenAction');
    return updated;
  }

  deleteInvoice(organizationId: string, invoiceId: string): boolean {
    const list = this.invoicesByOrg.get(organizationId);
    if (!list) return false;

    const initialLength = list.length;
    const filtered = list.filter(i => i.id !== invoiceId);
    if (filtered.length === initialLength) return false;

    this.invoicesByOrg.set(organizationId, filtered);
    return true;
  }
}

export const dbStore = new MultiTenantStore();
