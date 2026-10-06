import { describe, expect, it } from "vitest";
import {
  countByFocus,
  exerciseSeries,
  exercisesWithHistory,
  isoWeek,
  recentSessions,
  sessionsPerWeek,
  totals,
  weekStart,
} from "./stats";
import type { FocusId, Session } from "./types";

function s(id: string, date: string, focus: FocusId, sets: [string, number, number][], min = 50): Session {
  const names = [...new Set(sets.map((x) => x[0]))];
  return {
    id,
    date,
    startedAt: `${date}T10:00:00.000Z`,
    location: "gym_full",
    focus,
    durationMin: min,
    blocks: [
      {
        name: "B",
        type: "heavy",
        exercises: names.map((name) => ({
          name,
          prescribedSets: 1,
          prescribedReps: "5",
          restSec: 60,
          note: "",
          sets: sets.filter((x) => x[0] === name).map(([, weightKg, reps]) => ({ weightKg, reps })),
        })),
      },
    ],
  };
}

const bench = "Bankdrücken (Langhantel)";
const data = [
  s("a", "2026-09-21", "upper", [[bench, 80, 5], [bench, 85, 3]]), // Monday
  s("b", "2026-09-27", "lower", [["Kniebeuge (Langhantel)", 100, 5]]), // Sunday, same week
  s("c", "2026-10-05", "upper", [[bench, 82.5, 5]]), // Monday
];

describe("weeks", () => {
  it("starts on Monday", () => {
    expect(weekStart("2026-09-21")).toBe("2026-09-21");
    expect(weekStart("2026-09-27")).toBe("2026-09-21");
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
  });
  it("numbers ISO weeks", () => {
    expect(isoWeek("2026-10-05")).toBe(41);
    expect(isoWeek("2026-01-01")).toBe(1);
    expect(isoWeek("2026-12-31")).toBe(53);
  });
  it("counts sessions per week including empty weeks", () => {
    const weeks = sessionsPerWeek(data, "2026-10-07", 4);
    expect(weeks.map((w) => [w.start, w.count])).toEqual([
      ["2026-09-14", 0],
      ["2026-09-21", 2],
      ["2026-09-28", 0],
      ["2026-10-05", 1],
    ]);
  });
});

describe("totals", () => {
  it("sums sessions, minutes, sets and the last 28 days", () => {
    expect(totals(data, "2026-10-07")).toEqual({ sessions: 3, minutes: 150, sets: 4, last28Days: 3 });
    expect(totals(data, "2026-10-25").last28Days).toBe(1);
    expect(recentSessions(data, "2026-10-25").map((x) => x.id)).toEqual(["c"]);
  });
  it("counts by focus, most frequent first", () => {
    expect(countByFocus(data)).toEqual([
      { focus: "upper", count: 2 },
      { focus: "lower", count: 1 },
    ]);
  });
});

describe("exercise series", () => {
  it("lists exercises by how often they were trained", () => {
    expect(exercisesWithHistory(data)[0]).toBe(bench);
  });
  it("uses the heaviest set per session for weight", () => {
    expect(exerciseSeries(data, bench, "weight").map((p) => p.value)).toEqual([85, 82.5]);
  });
  it("uses the best Epley estimate per session for e1RM", () => {
    const v = exerciseSeries(data, bench, "e1rm").map((p) => p.value);
    expect(v[0]).toBeCloseTo(Math.max(80 * (1 + 5 / 30), 85 * (1 + 3 / 30)));
    expect(v[1]).toBeCloseTo(82.5 * (1 + 5 / 30));
  });
  it("uses reps for exercises without load", () => {
    const run = [s("x", "2026-10-05", "endurance", [["Liegestütze", 0, 20], ["Liegestütze", 0, 25]])];
    expect(exerciseSeries(run, "Liegestütze", "weight").map((p) => p.value)).toEqual([25]);
  });
});
