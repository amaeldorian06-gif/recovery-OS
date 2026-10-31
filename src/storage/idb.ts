import { DB_NAME, StoreName, SCHEMA_VERSION } from './types';
import { StorageBackend, StorageTx } from './backend';

/**
 * Backend IndexedDB (persistance navigateur exclusive).
 * Seul module autorisé à ouvrir IndexedDB ; les composants passent par Repository.
 */
const STORE_DEFINITIONS: Record<StoreName, { keyPath: string; indexes: Array<{ name: string; keyPath: string }> }> = {
  meta: { keyPath: 'key', indexes: [] },
  organizations: { keyPath: 'id', indexes: [] },
  users: { keyPath: 'id', indexes: [{ name: 'email', keyPath: 'email' }] },
  sessions: { keyPath: 'token', indexes: [{ name: 'userId', keyPath: 'userId' }, { name: 'active', keyPath: 'active' }] },
  invoices: { keyPath: 'id', indexes: [{ name: 'organizationId', keyPath: 'organizationId' }] },
  payments: { keyPath: 'id', indexes: [{ name: 'organizationId', keyPath: 'organizationId' }, { name: 'invoiceId', keyPath: 'invoiceId' }] },
  promises: { keyPath: 'id', indexes: [{ name: 'organizationId', keyPath: 'organizationId' }, { name: 'invoiceId', keyPath: 'invoiceId' }] },
  disputes: { keyPath: 'id', indexes: [{ name: 'organizationId', keyPath: 'organizationId' }, { name: 'invoiceId', keyPath: 'invoiceId' }] },
  actions: { keyPath: 'id', indexes: [{ name: 'organizationId', keyPath: 'organizationId' }, { name: 'invoiceId', keyPath: 'invoiceId' }] },
  history: { keyPath: 'id', indexes: [{ name: 'organizationId', keyPath: 'organizationId' }, { name: 'entityId', keyPath: 'entityId' }] },
  settings: { keyPath: 'organizationId', indexes: [] },
};

function reqAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Erreur IndexedDB'));
  });
}

export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

export class IndexedDBBackend implements StorageBackend {
  readonly kind = 'indexeddb' as const;
  private db: IDBDatabase | null = null;

  constructor(private readonly dbName: string = DB_NAME) {}

  async open(): Promise<void> {
    if (this.db) return;
    if (!isIndexedDBAvailable()) {
      throw new Error(
        'IndexedDB est indisponible dans ce navigateur (mode privé ou contexte restreint). ' +
          'La persistance locale ne peut pas être garantie.'
      );
    }
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, SCHEMA_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const [name, def] of Object.entries(STORE_DEFINITIONS) as Array<[StoreName, typeof STORE_DEFINITIONS[StoreName]]>) {
          const store = db.objectStoreNames.contains(name)
            ? request.transaction!.objectStore(name)
            : db.createObjectStore(name, { keyPath: def.keyPath });
          for (const idx of def.indexes) {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, { unique: false });
            }
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Impossible d\'ouvrir IndexedDB'));
      request.onblocked = () => reject(new Error('Ouverture IndexedDB bloquée par un autre onglet.'));
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }

  private requireDb(): IDBDatabase {
    if (!this.db) throw new Error('Base IndexedDB non ouverte. Appelez open() d\'abord.');
    return this.db;
  }

  private async run<T>(stores: StoreName[], mode: IDBTransactionMode, fn: (tx: StorageTx) => Promise<T>): Promise<T> {
    const db = this.requireDb();
    const tx = db.transaction(stores, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Transaction IndexedDB échouée'));
      tx.onabort = () => reject(tx.error ?? new Error('Transaction IndexedDB annulée'));
    });

    const wrapped: StorageTx = {
      get: <V>(store: StoreName, key: string) => reqAsPromise<V | undefined>(tx.objectStore(store).get(key) as IDBRequest<V | undefined>),
      getAll: <V>(store: StoreName) => reqAsPromise<V[]>(tx.objectStore(store).getAll() as IDBRequest<V[]>),
      getAllByIndex: <V>(store: StoreName, index: string, value: string) =>
        reqAsPromise<V[]>(tx.objectStore(store).index(index).getAll(value) as IDBRequest<V[]>),
      put: async <V>(store: StoreName, value: V & { id?: string }, key?: string) => {
        if (key !== undefined) {
          await reqAsPromise(tx.objectStore(store).put(value as unknown as never, key));
        } else {
          await reqAsPromise(tx.objectStore(store).put(value as unknown as never));
        }
      },
      delete: (store: StoreName, key: string) => reqAsPromise(tx.objectStore(store).delete(key)),
      clear: (store: StoreName) => reqAsPromise(tx.objectStore(store).clear()),
    };

    // Modèle standard (bibliothèque `idb`) : IndexedDB maintient la transaction
    // ouverte tant que de nouvelles requêtes sont émises depuis la chaîne de
    // micro-tâches issue d'une requête précédente. Ne jamais insérer d'attente
    // arbitraire (setTimeout, fetch…) à l'intérieur de `fn`.
    const resultPromise = fn(wrapped);
    resultPromise.catch(() => {
      try {
        tx.abort();
      } catch {
        /* la transaction peut déjà être terminée */
      }
    });

    const [result] = await Promise.all([resultPromise, done]);
    return result;
  }

  readTx<T>(stores: StoreName[], fn: (tx: StorageTx) => Promise<T>): Promise<T> {
    return this.run(stores, 'readonly', fn);
  }

  writeTx<T>(stores: StoreName[], fn: (tx: StorageTx) => Promise<T>): Promise<T> {
    return this.run(stores, 'readwrite', fn);
  }
}
