import type { Prefs, Storage } from "../db/storage";
import type { Profile } from "../domain/auth";
import type { Draft } from "../domain/draft";
import type { ExerciseIndex, Session } from "../domain/types";
import type { WeekPlan } from "../domain/week";

export type Tab = "training" | "history" | "stats" | "data" | "login";

export interface AppState {
  sessions: Session[];
  index: ExerciseIndex;
  prefs: Prefs;
  draft: Draft | null;
  week: WeekPlan;
  profile: Profile;
}

export interface AppContext {
  storage: Storage;
  state: AppState;
  /** Debounced autosave of the running session. */
  saveDraft(): void;
  navigate(tab: Tab, openSessionId?: string): void;
  toast(message: string): void;
  /** Persists the weekly plan. */
  saveWeek(): Promise<void>;
  /** Re-reads sessions, rebuilds the exercise index and persists it. */
  reloadSessions(): Promise<void>;
}
