import type { ExerciseIndex, Session } from "../domain/types";
import type { Storage } from "./storage";

const DB_NAME = "trainingsapp";
const DB_VERSION = 1;
const SESSIONS = "sessions";
const INDEX = "exerciseIndex";
const META = "meta";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function open(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore(SESSIONS, { keyPath: "id" });
      db.createObjectStore(INDEX, { keyPath: "name" });
      db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function createIdbStorage(factory: IDBFactory = indexedDB): Promise<Storage> {
  const db = await open(factory);

  return {
    async getSessions() {
      return request(db.transaction(SESSIONS).objectStore(SESSIONS).getAll());
    },
    async putSession(session: Session) {
      const tx = db.transaction(SESSIONS, "readwrite");
      tx.objectStore(SESSIONS).put(session);
      await done(tx);
    },
    async putSessions(sessions: Session[]) {
      const tx = db.transaction(SESSIONS, "readwrite");
      for (const s of sessions) tx.objectStore(SESSIONS).put(s);
      await done(tx);
    },
    async deleteSession(id: string) {
      const tx = db.transaction(SESSIONS, "readwrite");
      tx.objectStore(SESSIONS).delete(id);
      await done(tx);
    },
    async getIndex() {
      const entries = await request(db.transaction(INDEX).objectStore(INDEX).getAll());
      return Object.fromEntries(entries.map((e) => [e.name, e])) as ExerciseIndex;
    },
    async setIndex(index: ExerciseIndex) {
      const tx = db.transaction(INDEX, "readwrite");
      const store = tx.objectStore(INDEX);
      store.clear();
      for (const entry of Object.values(index)) store.put(entry);
      await done(tx);
    },
    async getMeta<T>(key: string) {
      return (await request(db.transaction(META).objectStore(META).get(key))) as T | undefined;
    },
    async setMeta<T>(key: string, value: T | null) {
      const tx = db.transaction(META, "readwrite");
      if (value === null) tx.objectStore(META).delete(key);
      else tx.objectStore(META).put(value, key);
      await done(tx);
    },
  };
}
