export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "rower"
  | "skierg"
  | "kettlebell"
  | "machine"
  | "box"
  | "pullupbar"
  | "bench"
  | "mats"
  | "wallbars"
  | "medball"
  | "sandbag";

export type LocationId = "gym_full" | "school_gym" | "minimal";
export type FocusId = "upper" | "lower" | "full" | "athx" | "endurance";
export type BlockType = "heavy" | "accessory" | "metcon";
export type Unit = "reps" | "m" | "cal" | "s";
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "quads"
  | "posterior"
  | "calves"
  | "core"
  | "cardio";

export interface ExerciseDef {
  name: string;
  group: MuscleGroup;
  /** All listed equipment must be available at the location. Empty = no equipment needed. */
  requires: Equipment[];
  /** Whether a load in kg is logged for this exercise. */
  weighted: boolean;
  /** Unit of the second value of a set (stored in `Set.reps`). */
  unit: Unit;
}

export interface SetEntry {
  weightKg: number;
  reps: number;
}

export interface Exercise {
  name: string;
  prescribedSets: number;
  /** "5" or a range like "8-10". */
  prescribedReps: string;
  restSec: number;
  note: string;
  /** Load from the competition standard, used as prefill when there is no history. */
  targetKg?: number;
  sets: SetEntry[];
}

export interface Block {
  name: string;
  type: BlockType;
  exercises: Exercise[];
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD, local
  startedAt: string; // ISO timestamp
  location: LocationId;
  focus: FocusId;
  durationMin: number;
  blocks: Block[];
}

export interface ExerciseIndexEntry {
  name: string;
  lastWeight: number;
  lastReps: number;
  bestE1RM: number;
  lastDate: string;
}

export type ExerciseIndex = Record<string, ExerciseIndexEntry>;

export interface Plan {
  location: LocationId;
  focus: FocusId;
  budgetMin: number;
  blocks: Block[];
  /** Estimated duration in minutes of the included blocks. */
  estimatedMin: number;
  /** Notes about dropped exercises/blocks, shown to the user. */
  omitted: string[];
}
