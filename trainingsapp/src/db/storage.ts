import type { ExerciseIndex, FocusId, LocationId, Session } from "../domain/types";

export interface Prefs {
  location: LocationId;
  focus: FocusId;
  budgetMin: number;
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
