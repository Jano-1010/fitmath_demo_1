import { estimateE1RM } from "./e1rm";
import { exerciseDef } from "./exercises";
import { localDate } from "./format";
import type { FocusId, Session } from "./types";

const parse = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Monday of the week containing the given local date (YYYY-MM-DD). */
export function weekStart(iso: string): string {
  const d = parse(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(d);
}

/** ISO week number of the week containing the given date. */
export function isoWeek(iso: string): number {
  const d = parse(weekStart(iso));
  d.setDate(d.getDate() + 3); // Thursday decides the ISO year
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week1 = parse(weekStart(localDate(jan4)));
  return 1 + Math.round((d.getTime() - week1.getTime()) / (7 * 86400000));
}

export function addDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

export interface WeekCount {
  start: string; // Monday
  count: number;
}

/** Sessions per week for the last `weeks` weeks, ending with the week of `today`. Includes empty weeks. */
export function sessionsPerWeek(sessions: Session[], today: string, weeks = 12): WeekCount[] {
  const last = weekStart(today);
  const result: WeekCount[] = [];
  for (let i = weeks - 1; i >= 0; i--) result.push({ start: addDays(last, -7 * i), count: 0 });
  const byStart = new Map(result.map((w) => [w.start, w]));
  for (const s of sessions) {
    const w = byStart.get(weekStart(s.date));
    if (w) w.count++;
  }
  return result;
}

export function sessionsInWeek(sessions: Session[], start: string): Session[] {
  return sessions.filter((s) => weekStart(s.date) === start);
}

export function countSets(session: Session): number {
  return session.blocks.reduce((n, b) => n + b.exercises.reduce((m, e) => m + e.sets.length, 0), 0);
}

export interface Totals {
  sessions: number;
  minutes: number;
  sets: number;
  last28Days: number;
}

export function totals(sessions: Session[], today: string): Totals {
  const since = addDays(today, -27);
  return {
    sessions: sessions.length,
    minutes: sessions.reduce((n, s) => n + s.durationMin, 0),
    sets: sessions.reduce((n, s) => n + countSets(s), 0),
    last28Days: sessions.filter((s) => s.date >= since && s.date <= today).length,
  };
}

export function recentSessions(sessions: Session[], today: string): Session[] {
  const since = addDays(today, -27);
  return sessions.filter((s) => s.date >= since && s.date <= today);
}

export function countByFocus(sessions: Session[]): { focus: FocusId; count: number }[] {
  const counts = new Map<FocusId, number>();
  for (const s of sessions) counts.set(s.focus, (counts.get(s.focus) ?? 0) + 1);
  return [...counts].map(([focus, count]) => ({ focus, count })).sort((a, b) => b.count - a.count);
}

/** Exercises that appear in at least one session, most frequently trained first. */
export function exercisesWithHistory(sessions: Session[]): string[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const seen = new Set<string>();
    for (const b of s.blocks)
      for (const e of b.exercises) if (e.sets.length > 0) seen.add(e.name);
    for (const n of seen) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de")).map(([n]) => n);
}

export type Metric = "weight" | "e1rm";

export interface SeriesPoint {
  date: string;
  sessionId: string;
  value: number;
}

/** Whether the e1RM curve makes sense for an exercise (loaded, counted in reps). */
export function supportsE1RM(name: string): boolean {
  const def = exerciseDef(name);
  return !def || (def.weighted && def.unit === "reps");
}

/**
 * One point per session: the best value of that exercise in the session. "weight" is the heaviest set
 * (or the highest amount for exercises without load), "e1rm" the best Epley estimate.
 */
export function exerciseSeries(sessions: Session[], name: string, metric: Metric): SeriesPoint[] {
  const def = exerciseDef(name);
  const loaded = !def || def.weighted;
  const points: SeriesPoint[] = [];
  const ordered = [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startedAt.localeCompare(b.startedAt),
  );
  for (const s of ordered) {
    let best = 0;
    let found = false;
    for (const b of s.blocks)
      for (const e of b.exercises) {
        if (e.name !== name) continue;
        for (const set of e.sets) {
          found = true;
          const v =
            metric === "e1rm"
              ? estimateE1RM(set.weightKg, set.reps)
              : loaded
                ? set.weightKg
                : set.reps;
          best = Math.max(best, v);
        }
      }
    if (found) points.push({ date: s.date, sessionId: s.id, value: best });
  }
  return points;
}
