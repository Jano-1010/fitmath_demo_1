import { exerciseDef } from "./exercises";
import { exerciseSeries, exercisesWithHistory, supportsE1RM } from "./stats";
import type { Session } from "./types";

export interface StrengthRow {
  name: string;
  /** Best estimated 1RM of the first session with a loaded set. */
  start: number;
  startDate: string;
  /** Best estimated 1RM of the most recent session. */
  current: number;
  currentDate: string;
  /** Best estimated 1RM ever. */
  best: number;
  sessions: number;
  /** Change from start to current in percent. Null while there is only one session to compare. */
  changePct: number | null;
}

/** Strength per loaded exercise as estimated 1RM (Epley): start versus now. Sorted by current value. */
export function strengthRows(sessions: Session[]): StrengthRow[] {
  const rows: StrengthRow[] = [];
  for (const name of exercisesWithHistory(sessions)) {
    const def = exerciseDef(name);
    if (!supportsE1RM(name) || (def && !def.weighted)) continue;
    const series = exerciseSeries(sessions, name, "e1rm").filter((p) => p.value > 0);
    if (series.length === 0) continue;
    const first = series[0];
    const last = series[series.length - 1];
    rows.push({
      name,
      start: first.value,
      startDate: first.date,
      current: last.value,
      currentDate: last.date,
      best: Math.max(...series.map((p) => p.value)),
      sessions: series.length,
      changePct: series.length >= 2 ? (last.value / first.value - 1) * 100 : null,
    });
  }
  return rows.sort((a, b) => b.current - a.current);
}

/** Average change over all exercises that have a comparison. Null if there are none. */
export function averageChange(rows: StrengthRow[]): number | null {
  const withChange = rows.filter((r): r is StrengthRow & { changePct: number } => r.changePct !== null);
  if (withChange.length === 0) return null;
  return withChange.reduce((n, r) => n + r.changePct, 0) / withChange.length;
}
