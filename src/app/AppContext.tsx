import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { InvoiceRecord } from '../types';
import { Repository } from '../storage/repository';
import { MemoryBackend } from '../storage/backend';
import { IndexedDBBackend } from '../storage/idb';
import { ActionRecord, HistoryEntry, LicenseInfo, LocalUser, Organization, SettingsRecord } from '../storage/types';
import { buildDemoInvoices } from '../storage/seed';
import { validateLicenseKey, buildLicense } from '../storage/license';
import { todayISO } from '../utils/dates';

/**
 * Contexte applicatif — seule passerelle entre l'UI et le Repository.
 *
 * Deux modes coexistent :
 *  - mode réel : Repository sur IndexedDB, session persistée ;
 *  - mode démonstration : Repository sur backend mémoire, données de démo,
 *    jamais persistées, et physiquement séparées des données réelles.
 */

export type AppMode = 'real' | 'demo';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: LocalUser['role'];
}

export interface AppContextValue {
  ready: boolean;
  mode: AppMode;
  storageAvailable: boolean;
  organization: Organization | null;
  user: SessionUser | null;
  license: LicenseInfo | null;
  invoices: InvoiceRecord[];
  actions: ActionRecord[];
  history: HistoryEntry[];
  settings: SettingsRecord | null;
  busy: boolean;
  error: string | null;
  clearError: () => void;

  // Session
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email: string; companyName: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  needsAccount: boolean;

  // Données
  refresh: () => Promise<void>;
  importInvoices: (invoices: InvoiceRecord[], mode: 'replace' | 'merge' | 'update') => Promise<{ inserted: number; updated: number; skipped: number; rejected: number }>;
  recordPayment: (invoiceId: string, input: { amount: number; paidDate: string; reference: string }) => Promise<void>;
  recordPromise: (invoiceId: string, input: { promisedDate: string; notes: string }) => Promise<void>;
  setDispute: (invoiceId: string, disputed: boolean, reason?: string) => Promise<void>;
  saveAction: (action: Omit<ActionRecord, 'id' | 'organizationId' | 'createdAt'>) => Promise<void>;
  saveSettings: (patch: Partial<SettingsRecord>) => Promise<void>;

  // Licence
  activateLicense: (key: string) => Promise<LicenseInfo>;

  // Démonstration
  startDemo: () => void;
  exitDemo: () => void;

  repo: Repository | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_ORG: Organization = {
  id: 'org-demo',
  name: 'Démonstration — Données éphémères',
  defaultCurrency: 'EUR',
  createdAt: '',
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AppMode>('real');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const realRepoRef = useRef<Repository | null>(null);
  const demoRepoRef = useRef<Repository | null>(null);

  const activeRepo = useMemo<Repository | null>(() => {
    if (mode === 'demo') return demoRepoRef.current;
    return realRepoRef.current;
  }, [mode]);

  const loadAll = useCallback(async (repo: Repository, orgId: string) => {
    const [inv, act, hist, set, lic] = await Promise.all([
      repo.listInvoices(orgId, todayISO()),
      repo.listActions(orgId),
      repo.listHistory(orgId),
      repo.getSettings(orgId),
      repo.getLicense(),
    ]);
    setInvoices(inv);
    setActions(act);
    setHistory(hist);
    setSettings(set);
    setLicense(lic);
  }, []);

  // Bootstrap
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repo = new Repository(new IndexedDBBackend());
        await repo.init();
        realRepoRef.current = repo;
        const session = await repo.currentSession();
        if (session) {
          setOrganization(session.organization);
          setUser({
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.fullName,
            role: session.user.role,
          });
          await loadAll(repo, session.organization.id);
        }
      } catch (err) {
        setStorageAvailable(false);
        setError(err instanceof Error ? err.message : 'IndexedDB indisponible.');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  const refresh = useCallback(async () => {
    const repo = activeRepo;
    if (!repo || !organization) return;
    await loadAll(repo, organization.id);
  }, [activeRepo, organization, loadAll]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue.');
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const repo = realRepoRef.current;
    if (!repo) throw new Error('Stockage local indisponible.');
    const result = await repo.login(email, password);
    setToken(result.token);
    setOrganization(result.organization);
    setUser({
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    });
    setMode('real');
    await loadAll(repo, result.organization.id);
  }, [loadAll]);

  const register = useCallback(async (input: { fullName: string; email: string; companyName: string; password: string }) => {
    const repo = realRepoRef.current;
    if (!repo) throw new Error('Stockage local indisponible.');
    const result = await repo.registerUser(input);
    setToken(result.token);
    setOrganization(result.organization);
    setUser({
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    });
    setMode('real');
    await loadAll(repo, result.organization.id);
  }, [loadAll]);

  const signOut = useCallback(async () => {
    const repo = realRepoRef.current;
    if (repo && token) {
      try {
        await repo.logout(token);
      } catch {
        /* la session peut déjà être expirée */
      }
    }
    setToken(null);
    setOrganization(null);
    setUser(null);
    setInvoices([]);
    setActions([]);
    setHistory([]);
    setSettings(null);
    setLicense(null);
  }, [token]);

  const startDemo = useCallback(async () => {
    const repo = new Repository(new MemoryBackend([
      'meta', 'organizations', 'users', 'sessions',
      'invoices', 'payments', 'promises', 'disputes', 'actions', 'history', 'settings',
    ]));
    await repo.init();
    demoRepoRef.current = repo;
    const demoOrg: Organization = { ...DEMO_ORG, createdAt: new Date().toISOString() };
    await repo.importInvoices(demoOrg.id, buildDemoInvoices(), 'replace', 'EUR');
    setMode('demo');
    setOrganization(demoOrg);
    setUser({ id: 'demo-user', email: 'demo@revenue-recovery.local', fullName: 'Utilisateur démo', role: 'owner' });
    await loadAll(repo, demoOrg.id);
  }, [loadAll]);

  const exitDemo = useCallback(() => {
    demoRepoRef.current = null;
    setMode('real');
    setOrganization(null);
    setUser(null);
    setInvoices([]);
    setActions([]);
    setHistory([]);
    setSettings(null);
  }, []);

  const value: AppContextValue = {
    ready,
    mode,
    storageAvailable,
    organization,
    user,
    license,
    invoices,
    actions,
    history,
    settings,
    busy,
    error,
    clearError: () => setError(null),
    needsAccount: ready && storageAvailable && mode === 'real' && !user,
    signIn,
    register,
    signOut,
    refresh,
    importInvoices: async (list, importMode) => {
      const repo = activeRepo;
      if (!repo || !organization) throw new Error('Session requise.');
      const result = await repo.importInvoices(organization.id, list, importMode, organization.defaultCurrency);
      await loadAll(repo, organization.id);
      return result;
    },
    recordPayment: async (invoiceId, input) => {
      const repo = activeRepo;
      if (!repo || !organization) throw new Error('Session requise.');
      await repo.recordPayment(organization.id, invoiceId, input);
      await loadAll(repo, organization.id);
    },
    recordPromise: async (invoiceId, input) => {
      const repo = activeRepo;
      if (!repo || !organization) throw new Error('Session requise.');
      await repo.recordPromise(organization.id, invoiceId, input);
      await loadAll(repo, organization.id);
    },
    setDispute: async (invoiceId, disputed, reason) => {
      const repo = activeRepo;
      if (!repo || !organization) throw new Error('Session requise.');
      await repo.setDispute(organization.id, invoiceId, disputed, reason);
      await loadAll(repo, organization.id);
    },
    saveAction: async action => {
      const repo = activeRepo;
      if (!repo || !organization) throw new Error('Session requise.');
      await repo.saveAction(organization.id, action);
      await loadAll(repo, organization.id);
    },
    saveSettings: async patch => {
      const repo = activeRepo;
      if (!repo || !organization) throw new Error('Session requise.');
      await repo.saveSettings(organization.id, patch);
      await loadAll(repo, organization.id);
    },
    activateLicense: async key => {
      const repo = activeRepo;
      if (!repo) throw new Error('Stockage local indisponible.');
      const validation = validateLicenseKey(key);
      if (!validation.ok) throw new Error(validation.reason);
      const info = buildLicense(validation.plan, key.trim().toUpperCase());
      await repo.saveLicense(info);
      setLicense(info);
      return info;
    },
    startDemo: () => {
      void startDemo();
    },
    exitDemo,
    repo: activeRepo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
