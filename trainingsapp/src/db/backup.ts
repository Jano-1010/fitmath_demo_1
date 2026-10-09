import type { Session } from "../domain/types";
import type { WeekPlan } from "../domain/week";
import type { Prefs } from "./storage";

export const BACKUP_VERSION = 1;

export interface Backup {
  app: "trainingsapp";
  version: number;
  exportedAt: string;
  prefs?: Prefs;
  week?: WeekPlan;
  sessions: Session[];
}

export function makeBackup(sessions: Session[], prefs: Prefs | undefined, week: WeekPlan | undefined, now = new Date()): Backup {
  return {
    app: "trainingsapp",
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    ...(prefs ? { prefs } : {}),
    ...(week ? { week } : {}),
    sessions,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function validSession(s: unknown): s is Session {
  if (!isObj(s)) return false;
  if (typeof s.id !== "string" || typeof s.date !== "string" || typeof s.startedAt !== "string") return false;
  if (!Array.isArray(s.blocks)) return false;
  return s.blocks.every(
    (b) =>
      isObj(b) &&
      typeof b.name === "string" &&
      Array.isArray(b.exercises) &&
      b.exercises.every(
        (e) =>
          isObj(e) &&
          typeof e.name === "string" &&
          Array.isArray(e.sets) &&
          e.sets.every(
            (st) => isObj(st) && Number.isFinite(st.weightKg) && Number.isFinite(st.reps),
          ),
      ),
  );
}

/** Parses and validates a backup file. Throws a German error message on invalid input. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  if (!isObj(data) || data.app !== "trainingsapp" || !Array.isArray(data.sessions)) {
    throw new Error("Datei ist kein Backup dieser App.");
  }
  if (typeof data.version !== "number" || data.version > BACKUP_VERSION) {
    throw new Error("Backup stammt von einer neueren App-Version.");
  }
  const bad = data.sessions.findIndex((s) => !validSession(s));
  if (bad >= 0) throw new Error(`Einheit Nr. ${bad + 1} im Backup ist beschädigt.`);
  return data as unknown as Backup;
}
