import type { Prefs, Storage } from "../db/storage";
import type { Draft } from "../domain/draft";
import type { ExerciseIndex, Session } from "../domain/types";

export type Tab = "training" | "history" | "stats" | "data";

export interface AppState {
  sessions: Session[];
  index: ExerciseIndex;
  prefs: Prefs;
  draft: Draft | null;
}

export interface AppContext {
  storage: Storage;
  state: AppState;
  /** Debounced autosave of the running session. */
  saveDraft(): void;
  navigate(tab: Tab, openSessionId?: string): void;
  toast(message: string): void;
  /** Re-reads sessions, rebuilds the exercise index and persists it. */
  reloadSessions(): Promise<void>;
}
