import { estimateE1RM } from "./e1rm";
import { exerciseDef } from "./exercises";
import type { ExerciseIndex, Session } from "./types";

/** Rebuilds the per-exercise index from all sessions. Pure, so it also works after import or delete. */
export function buildIndex(sessions: Session[]): ExerciseIndex {
  const ordered = [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startedAt.localeCompare(b.startedAt),
  );
  const index: ExerciseIndex = {};
  for (const session of ordered) {
    for (const block of session.blocks) {
      for (const exercise of block.exercises) {
        if (exercise.sets.length === 0) continue;
        const def = exerciseDef(exercise.name);
        const trackE1RM = def ? def.weighted && def.unit === "reps" : true;
        const last = exercise.sets[exercise.sets.length - 1];
        const prev = index[exercise.name];
        let best = prev?.bestE1RM ?? 0;
        if (trackE1RM) {
          for (const s of exercise.sets) best = Math.max(best, estimateE1RM(s.weightKg, s.reps));
        }
        index[exercise.name] = {
          name: exercise.name,
          lastWeight: last.weightKg,
          lastReps: last.reps,
          bestE1RM: best,
          lastDate: session.date,
        };
      }
    }
  }
  return index;
}
