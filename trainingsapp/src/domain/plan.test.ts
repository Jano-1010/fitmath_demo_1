import { describe, expect, it } from "vitest";
import { exerciseDef, EXERCISES } from "./exercises";
import { BUDGETS, FOCI, LOCATIONS } from "./locations";
import { generatePlan } from "./plan";
import { TEMPLATES } from "./templates";

describe("templates", () => {
  it("only reference exercises from the fixed list", () => {
    for (const blocks of Object.values(TEMPLATES))
      for (const b of blocks)
        for (const s of b.slots)
          for (const o of s.options) expect(exerciseDef(o.name), o.name).toBeDefined();
  });
  it("have unique exercise names", () => {
    expect(new Set(EXERCISES.map((e) => e.name)).size).toBe(EXERCISES.length);
  });
});

describe("generatePlan", () => {
  it("never uses equipment the location does not have (hard rule)", () => {
    for (const loc of LOCATIONS)
      for (const focus of FOCI)
        for (const budget of BUDGETS) {
          const plan = generatePlan(loc.id, focus.id, budget);
          for (const b of plan.blocks)
            for (const e of b.exercises)
              for (const req of exerciseDef(e.name)!.requires)
                expect(loc.equipment, `${loc.id}/${focus.id}: ${e.name}`).toContain(req);
        }
  });

  it("stays within the time budget", () => {
    for (const loc of LOCATIONS)
      for (const focus of FOCI)
        for (const budget of BUDGETS)
          expect(generatePlan(loc.id, focus.id, budget).estimatedMin).toBeLessThanOrEqual(budget);
  });

  it("drops low priority blocks first when the budget is tight", () => {
    const short = generatePlan("gym_full", "upper", 30);
    const long = generatePlan("gym_full", "upper", 60);
    expect(short.blocks.map((b) => b.name)).toEqual(["Schwer: Druck und Zug"]);
    expect(long.blocks.length).toBe(3);
    expect(short.omitted.some((o) => o.includes("Zeitbudget"))).toBe(true);
  });

  it("never offers sandbag exercises, since no location has a sandbag", () => {
    for (const loc of LOCATIONS) {
      const names = generatePlan(loc.id, "athx", 60).blocks.flatMap((b) => b.exercises.map((e) => e.name));
      expect(names).not.toContain("Sandbag Squats");
      expect(names).not.toContain("Sandbag Carry");
    }
  });

  it("marks substitutes in the MetCon X and keeps competition loads only on the original", () => {
    const plan = generatePlan("gym_full", "athx", 60);
    const metcon = plan.blocks.find((b) => b.name.startsWith("MetCon X"))!;
    const squat = metcon.exercises.find((e) => e.name === "Goblet Squat (Kettlebell)")!;
    expect(squat.note).toContain("Ersatz für Sandbag Squats");
    expect(squat.targetKg).toBeUndefined();
    const g2o = metcon.exercises.find((e) => e.name === "DB Ground to Overhead")!;
    expect(g2o.targetKg).toBe(20);
  });

  it("allows the repeated rowing in MetCon X but no other duplicates", () => {
    const names = generatePlan("gym_full", "athx", 60)
      .blocks.find((b) => b.name.startsWith("MetCon X"))!
      .exercises.map((e) => e.name);
    expect(names.filter((n) => n === "Rudern (Ergometer)")).toHaveLength(2);
  });

  it("skips blocks without any usable exercise and says so", () => {
    const plan = generatePlan("minimal", "athx", 60);
    expect(plan.blocks.map((b) => b.name)).not.toContain("Strength Zone: Back Squat");
    expect(plan.omitted.some((o) => o.includes("Back Squat"))).toBe(true);
  });
});
