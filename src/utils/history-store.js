const ARCHIVE_DB_NAME = 'voice-desk-archive';
const ARCHIVE_STORE_NAME = 'renders';
const ARCHIVE_LIMIT = 50;

function openArchiveDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ARCHIVE_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(ARCHIVE_STORE_NAME)) {
        database.createObjectStore(ARCHIVE_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

function createArchiveRecord({ text, model, modelLabel, voice, speed, lang, audio }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    text,
    model,
    modelLabel: modelLabel || model,
    voice,
    speed,
    lang,
    createdAt: Date.now(),
    audio,
  };
}

async function trimArchiveOverflow() {
  const database = await openArchiveDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ARCHIVE_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result || [];

      if (records.length <= ARCHIVE_LIMIT) {
        database.close();
        resolve();
        return;
      }

      records
        .sort((left, right) => left.createdAt - right.createdAt)
        .slice(0, records.length - ARCHIVE_LIMIT)
        .forEach((record) => store.delete(record.id));

      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function persistRenderSession(payload) {
  const record = createArchiveRecord(payload);
  const database = await openArchiveDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE_NAME, 'readwrite');
    transaction.objectStore(ARCHIVE_STORE_NAME).add(record);

    transaction.oncomplete = async () => {
      database.close();
      await trimArchiveOverflow();
      resolve(record.id);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function listRenderSessions() {
  const database = await openArchiveDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(ARCHIVE_STORE_NAME).getAll();

    request.onsuccess = () => {
      const records = request.result || [];
      records.sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
      database.close();
      resolve(records);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function removeRenderSession(id) {
  const database = await openArchiveDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE_NAME, 'readwrite');
    transaction.objectStore(ARCHIVE_STORE_NAME).delete(id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function clearRenderArchive() {
  const database = await openArchiveDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE_NAME, 'readwrite');
    transaction.objectStore(ARCHIVE_STORE_NAME).clear();

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

// Compatibility exports while the app migrates to the new archive naming.
export const addEntry = persistRenderSession;
export const getEntries = listRenderSessions;
export const deleteEntry = removeRenderSession;
export const clearAll = clearRenderArchive;
