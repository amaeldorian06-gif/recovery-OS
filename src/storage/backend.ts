import { StoreName } from './types';

/**
 * Contrat d'accès aux données.
 * Deux implémentations : IndexedDB (production) et mémoire (tests + démo éphémère).
 * Aucun composant applicatif ne manipule IndexedDB directement : tout passe
 * par la couche Repository qui utilise cette interface.
 */
export interface StorageTx {
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  getAll<T>(store: StoreName): Promise<T[]>;
  getAllByIndex<T>(store: StoreName, index: string, value: string): Promise<T[]>;
  put<T>(store: StoreName, value: T & { id?: string }, key?: string): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
  clear(store: StoreName): Promise<void>;
}

export interface StorageBackend {
  readonly kind: 'indexeddb' | 'memory';
  open(): Promise<void>;
  close(): void;
  readTx<T>(stores: StoreName[], fn: (tx: StorageTx) => Promise<T>): Promise<T>;
  writeTx<T>(stores: StoreName[], fn: (tx: StorageTx) => Promise<T>): Promise<T>;
}

/** Garantit l'unicité d'une clé d'entité. */
export function requireId(value: { id?: string }, context: string): string {
  if (!value.id) {
    throw new Error(`${context} : identifiant manquant`);
  }
  return value.id;
}

/**
 * Backend 100 % mémoire.
 *  - utilisé par la suite de tests ;
 *  - utilisé par le mode démonstration, afin qu'une démo ne puisse
 *    jamais altérer les données réelles de l'utilisateur.
 */
export class MemoryBackend implements StorageBackend {
  readonly kind = 'memory' as const;
  private stores = new Map<StoreName, Map<string, any>>();
  private writeQueue: Promise<unknown> = Promise.resolve();
  private opened = false;

  constructor(private readonly storeNames: StoreName[]) {
    for (const name of storeNames) {
      this.stores.set(name, new Map());
    }
  }

  async open(): Promise<void> {
    this.opened = true;
  }

  close(): void {
    this.opened = false;
  }

  isOpened(): boolean {
    return this.opened;
  }

  private bucket(store: StoreName): Map<string, any> {
    const map = this.stores.get(store);
    if (!map) {
      throw new Error(`Store inconnu : ${store}`);
    }
    return map;
  }

  private keyOf(store: StoreName, value: any, explicit?: string): string {
    if (explicit) return explicit;
    if (value && typeof value === 'object' && typeof value.id === 'string') return value.id;
    if (store === 'meta') return String(value?.key ?? 'default');
    if (store === 'sessions') return String(value?.token);
    if (store === 'settings') return String(value?.organizationId);
    throw new Error(`Impossible de dériver la clé du store ${store}`);
  }

  private makeTx(allowWrite: boolean): StorageTx {
    const backend = this;
    return {
      async get<T>(store: StoreName, key: string) {
        return backend.bucket(store).get(key) as T | undefined;
      },
      async getAll<T>(store: StoreName) {
        return Array.from(backend.bucket(store).values()) as T[];
      },
      async getAllByIndex<T>(store: StoreName, index: string, value: string) {
        const all = Array.from(backend.bucket(store).values()) as Array<Record<string, unknown>>;
        return all.filter(item => String(item[index] ?? '') === value) as T[];
      },
      async put<T>(store: StoreName, value: T & { id?: string }, key?: string) {
        if (!allowWrite) throw new Error('Transaction en lecture seule');
        backend.bucket(store).set(backend.keyOf(store, value, key), value);
      },
      async delete(store: StoreName, key: string) {
        if (!allowWrite) throw new Error('Transaction en lecture seule');
        backend.bucket(store).delete(key);
      },
      async clear(store: StoreName) {
        if (!allowWrite) throw new Error('Transaction en lecture seule');
        backend.bucket(store).clear();
      },
    };
  }

  readTx<T>(stores: StoreName[], fn: (tx: StorageTx) => Promise<T>): Promise<T> {
    for (const s of stores) this.bucket(s);
    return fn(this.makeTx(false));
  }

  /** Serialise les écritures pour reproduire l'atomicité d'IndexedDB. */
  writeTx<T>(stores: StoreName[], fn: (tx: StorageTx) => Promise<T>): Promise<T> {
    for (const s of stores) this.bucket(s);
    const run = this.writeQueue.then(() => fn(this.makeTx(true)));
    this.writeQueue = run.catch(() => undefined);
    return run;
  }

  /** Aide de test : instantané complet. */
  snapshot(): Record<string, Array<Record<string, unknown>>> {
    const out: Record<string, Array<Record<string, unknown>>> = {};
    for (const [name, map] of this.stores) {
      out[name] = Array.from(map.values());
    }
    return out;
  }
}
