/**
 * Enterprise IndexedDB Storage Engine for DevDesk
 * Handles snapshot archives, large response bodies, and offline data
 * with graceful fallback when IndexedDB is unavailable.
 */

const DB_NAME = 'DevDeskEnterpriseDB';
const DB_VERSION = 1;

export interface StoredSnapshot {
  id: string;
  timestamp: string;
  label: string;
  data: any;
  sizeBytes: number;
  checksum?: string;
}

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('large_blobs')) {
          db.createObjectStore('large_blobs', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('DevDesk: IndexedDB access error, degrading gracefully.');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function saveSnapshotToDb(label: string, data: any, checksum?: string): Promise<string | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const serialized = JSON.stringify(data);
      const snapshot: StoredSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        label: label || 'Automatic Recovery Checkpoint',
        data,
        sizeBytes: new Blob([serialized]).size,
        checksum,
      };

      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      const req = store.put(snapshot);

      req.onsuccess = () => resolve(snapshot.id);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function listSnapshotsFromDb(): Promise<Array<Omit<StoredSnapshot, 'data'>>> {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as StoredSnapshot[];
        const metadata = (results || []).map((item) => ({
          id: item.id,
          timestamp: item.timestamp,
          label: item.label,
          sizeBytes: item.sizeBytes,
          checksum: item.checksum,
        }));
        metadata.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(metadata);
      };

      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function getSnapshotById(id: string): Promise<any | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result as StoredSnapshot | undefined;
        resolve(result ? result.data : null);
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteSnapshotFromDb(id: string): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function clearAllSnapshots(): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}
