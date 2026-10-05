import { describe, expect, it } from "vitest";
import { buildIndex } from "./exercise-index";
import type { Session } from "./types";

function session(id: string, date: string, name: string, sets: [number, number][]): Session {
  return {
    id,
    date,
    startedAt: `${date}T10:00:00.000Z`,
    location: "gym_full",
    focus: "upper",
    durationMin: 45,
    blocks: [
      {
        name: "B",
        type: "heavy",
        exercises: [
          {
            name,
            prescribedSets: sets.length,
            prescribedReps: "5",
            restSec: 120,
            note: "",
            sets: sets.map(([weightKg, reps]) => ({ weightKg, reps })),
          },
        ],
      },
    ],
  };
}

describe("buildIndex", () => {
  const name = "Bankdrücken (Langhantel)";

  it("uses the last set of the most recent session as last weight", () => {
    const idx = buildIndex([
      session("b", "2026-10-05", name, [[80, 5], [82.5, 4]]),
      session("a", "2026-09-28", name, [[77.5, 5]]),
    ]);
    expect(idx[name]).toMatchObject({ lastWeight: 82.5, lastReps: 4, lastDate: "2026-10-05" });
  });

  it("keeps the best e1RM over all sessions, even if it is not the latest", () => {
    const idx = buildIndex([
      session("a", "2026-09-28", name, [[100, 5]]),
      session("b", "2026-10-05", name, [[80, 5]]),
    ]);
    expect(idx[name].bestE1RM).toBeCloseTo(100 * (1 + 5 / 30));
    expect(idx[name].lastWeight).toBe(80);
  });

  it("does not track e1RM for distance based exercises", () => {
    const idx = buildIndex([session("a", "2026-10-05", "Laufen", [[0, 3000]])]);
    expect(idx["Laufen"]).toMatchObject({ lastReps: 3000, bestE1RM: 0 });
  });

  it("returns an empty index without sessions", () => {
    expect(buildIndex([])).toEqual({});
  });
});
