import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "./backup";
import { createIdbStorage } from "./idb";
import type { Session } from "../domain/types";

const session: Session = {
  id: "a",
  date: "2026-10-05",
  startedAt: "2026-10-05T10:00:00.000Z",
  location: "gym_full",
  focus: "upper",
  durationMin: 40,
  blocks: [{ name: "B", type: "heavy", exercises: [{ name: "Klimmzüge", prescribedSets: 1, prescribedReps: "5", restSec: 60, note: "", sets: [{ weightKg: 10, reps: 5 }] }] }],
};

describe("idb storage", () => {
  it("round-trips sessions, meta and deletes", async () => {
    const s = await createIdbStorage(indexedDB);
    await s.putSession(session);
    expect(await s.getSessions()).toEqual([session]);
    await s.setMeta("draft", { x: 1 });
    expect(await s.getMeta("draft")).toEqual({ x: 1 });
    await s.setMeta("draft", null);
    expect(await s.getMeta("draft")).toBeUndefined();
    await s.deleteSession("a");
    expect(await s.getSessions()).toEqual([]);
  });
});

describe("backup", () => {
  it("exports and re-imports", () => {
    const text = JSON.stringify(makeBackup([session], undefined));
    expect(parseBackup(text).sessions).toEqual([session]);
  });
  it("rejects foreign or broken files", () => {
    expect(() => parseBackup("nope")).toThrow();
    expect(() => parseBackup('{"app":"x","sessions":[]}')).toThrow();
    expect(() => parseBackup('{"app":"trainingsapp","version":1,"sessions":[{"id":1}]}')).toThrow(/beschädigt/);
  });
});
