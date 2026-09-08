/**
 * IndexedDB Wrapper — Offline-first data persistence
 * Replaces Supabase for full offline support
 */

const DB_NAME = 'pranaai_db';
const DB_VERSION = 1;

interface DBSchema {
  users: { id: string; name: string; email: string; password: string; createdAt: number };
  sessions: { id: string; userId: string; type: string; data: unknown; timestamp: number };
  journal: { id: string; userId: string; text: string; mood: string; sentimentScore: number; tags: string[]; timestamp: number };
  breathing: { id: string; userId: string; pattern: unknown; duration: number; completedCycles: number; timestamp: number };
  chat: { id: string; userId: string; role: string; content: string; timestamp: number };
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('email', 'email', { unique: true });
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionsStore.createIndex('userId', 'userId');
        sessionsStore.createIndex('timestamp', 'timestamp');
      }

      // Journal store
      if (!db.objectStoreNames.contains('journal')) {
        const journalStore = db.createObjectStore('journal', { keyPath: 'id' });
        journalStore.createIndex('userId', 'userId');
        journalStore.createIndex('timestamp', 'timestamp');
      }

      // Breathing store
      if (!db.objectStoreNames.contains('breathing')) {
        const breathingStore = db.createObjectStore('breathing', { keyPath: 'id' });
        breathingStore.createIndex('userId', 'userId');
        breathingStore.createIndex('timestamp', 'timestamp');
      }

      // Chat store
      if (!db.objectStoreNames.contains('chat')) {
        const chatStore = db.createObjectStore('chat', { keyPath: 'id' });
        chatStore.createIndex('userId', 'userId');
        chatStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Generic CRUD operations
async function add<T extends { id: string }>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function get<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getByIndex<T>(storeName: string, indexName: string, value: IDBKeyRange | IDBValidKey): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============ User Operations ============

export async function createUser(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email already exists
    const existing = await getByIndex<DBSchema['users']>('users', 'email', email);
    if (existing.length > 0) {
      return { success: false, error: 'Email already registered. Try signing in.' };
    }

    const user: DBSchema['users'] = {
      id: crypto.randomUUID(),
      name,
      email,
      password, // In production, hash this!
      createdAt: Date.now(),
    };

    await add('users', user);
    console.log('[DB] User created:', email);
    return { success: true };
  } catch (err) {
    console.error('[DB] Create user error:', err);
    return { success: false, error: 'Failed to create account' };
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: { id: string; name: string; email: string }; error?: string }> {
  try {
    const users = await getByIndex<DBSchema['users']>('users', 'email', email);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email' };
    }

    const user = users[0];
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    console.log('[DB] User logged in:', email);
    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    };
  } catch (err) {
    console.error('[DB] Login error:', err);
    return { success: false, error: 'Login failed' };
  }
}

// ============ Journal Operations ============

export async function addJournalEntry(userId: string, entry: Omit<DBSchema['journal'], 'id' | 'userId' | 'timestamp'>): Promise<void> {
  await add('journal', {
    id: crypto.randomUUID(),
    userId,
    ...entry,
    timestamp: Date.now(),
  });
}

export async function getJournalEntries(userId: string): Promise<DBSchema['journal'][]> {
  const entries = await getByIndex<DBSchema['journal']>('journal', 'userId', userId);
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

// ============ Breathing Operations ============

export async function addBreathingSession(userId: string, session: Omit<DBSchema['breathing'], 'id' | 'userId' | 'timestamp'>): Promise<void> {
  await add('breathing', {
    id: crypto.randomUUID(),
    userId,
    ...session,
    timestamp: Date.now(),
  });
}

export async function getBreathingSessions(userId: string): Promise<DBSchema['breathing'][]> {
  const sessions = await getByIndex<DBSchema['breathing']>('breathing', 'userId', userId);
  return sessions.sort((a, b) => b.timestamp - a.timestamp);
}

// ============ Chat Operations ============

export async function addChatMessage(userId: string, role: string, content: string): Promise<void> {
  await add('chat', {
    id: crypto.randomUUID(),
    userId,
    role,
    content,
    timestamp: Date.now(),
  });
}

export async function getChatMessages(userId: string): Promise<DBSchema['chat'][]> {
  const messages = await getByIndex<DBSchema['chat']>('chat', 'userId', userId);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

// ============ Export Operations ============

export async function exportUserData(userId: string): Promise<string> {
  const journal = await getJournalEntries(userId);
  const breathing = await getBreathingSessions(userId);
  const chat = await getChatMessages(userId);

  const data = {
    exportDate: new Date().toISOString(),
    userId,
    stats: {
      journalEntries: journal.length,
      breathingSessions: breathing.length,
      chatMessages: chat.length,
    },
    journal,
    breathing,
    chat,
  };

  return JSON.stringify(data, null, 2);
}

export async function clearAllData(userId: string): Promise<void> {
  await clear('journal');
  await clear('breathing');
  await clear('chat');
  console.log('[DB] All data cleared for user:', userId);
}
