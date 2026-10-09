import type { ExerciseIndex, FocusId, LocationId, Session } from "../domain/types";

export interface Prefs {
  location: LocationId;
  budgetMin: number;
  /** Target number of sessions per week, used for the weekly suggestions. */
  sessionsPerWeek: number;
  /** Unused since the weekly plan; kept so old backups still load. */
  focus?: FocusId;
}

/** Everything the UI needs from persistence. A cloud backend only has to implement this interface. */
export interface Storage {
  getSessions(): Promise<Session[]>;
  putSession(session: Session): Promise<void>;
  putSessions(sessions: Session[]): Promise<void>;
  deleteSession(id: string): Promise<void>;
  getIndex(): Promise<ExerciseIndex>;
  setIndex(index: ExerciseIndex): Promise<void>;
  getMeta<T>(key: string): Promise<T | undefined>;
  setMeta<T>(key: string, value: T | null): Promise<void>;
}
