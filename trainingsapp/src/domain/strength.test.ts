import { describe, expect, it } from "vitest";
import { averageChange, strengthRows } from "./strength";
import type { Session } from "./types";

function s(id: string, date: string, sets: [string, number, number][]): Session {
  const names = [...new Set(sets.map((x) => x[0]))];
  return {
    id,
    date,
    startedAt: `${date}T10:00:00.000Z`,
    location: "gym_full",
    focus: "full",
    durationMin: 50,
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

const squat = "Kniebeuge (Langhantel)";
const bench = "Bankdrücken (Langhantel)";

describe("strengthRows", () => {
  const data = [
    s("a", "2026-09-01", [[squat, 100, 3], [bench, 60, 5]]),
    s("b", "2026-09-15", [[squat, 110, 3]]),
    s("c", "2026-10-01", [[squat, 105, 3], ["Laufen", 0, 3000], ["Liegestütze", 0, 20]]),
  ];

  it("compares start and current e1RM in percent", () => {
    const row = strengthRows(data).find((r) => r.name === squat)!;
    expect(row.start).toBeCloseTo(110); // 100 * (1 + 3/30)
    expect(row.current).toBeCloseTo(115.5); // 105 * 1.1
    expect(row.best).toBeCloseTo(121); // 110 * 1.1, reached in the middle
    expect(row.changePct).toBeCloseTo(5);
    expect(row.sessions).toBe(3);
  });

  it("has no comparison with a single session", () => {
    expect(strengthRows(data).find((r) => r.name === bench)!.changePct).toBeNull();
  });

  it("leaves out exercises without load or measured in distance", () => {
    expect(strengthRows(data).map((r) => r.name).sort()).toEqual([bench, squat].sort());
  });

  it("sorts by current value and averages only real comparisons", () => {
    const rows = strengthRows(data);
    expect(rows[0].name).toBe(squat);
    expect(averageChange(rows)).toBeCloseTo(5);
    expect(averageChange([])).toBeNull();
  });
});
