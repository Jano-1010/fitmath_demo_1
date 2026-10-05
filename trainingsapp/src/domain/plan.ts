import { exerciseDef } from "./exercises";
import { locationById } from "./locations";
import { DEFAULT_WORK_SEC, TEMPLATES, type Option, type Slot } from "./templates";
import type { Block, Exercise, FocusId, LocationId, Plan } from "./types";

function available(name: string, equipment: ReadonlySet<string>): boolean {
  const def = exerciseDef(name);
  if (!def) throw new Error(`Template references unknown exercise "${name}"`);
  return def.requires.every((r) => equipment.has(r));
}

function toExercise(slot: Slot, option: Option, substituteFor: string | null): Exercise {
  const isSubstitute = substituteFor !== null && slot.markSubstitute === true;
  const note = [
    isSubstitute ? undefined : slot.note,
    isSubstitute ? `Ersatz für ${substituteFor}` : undefined,
    option.note,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    name: option.name,
    prescribedSets: option.sets ?? slot.sets,
    prescribedReps: option.reps ?? slot.reps,
    restSec: slot.restSec,
    note,
    ...(option.targetKg !== undefined ? { targetKg: option.targetKg } : {}),
    sets: [],
  };
}

function slotMinutes(slot: Slot, option: Option): number {
  const sets = option.sets ?? slot.sets;
  const work = option.workSec ?? slot.workSec ?? DEFAULT_WORK_SEC;
  return (sets * (work + slot.restSec)) / 60;
}

interface Candidate {
  block: Block;
  priority: number;
  order: number;
  minutes: number;
}

/**
 * Builds a plan from the templates. Hard rule: only exercises whose equipment is fully available at the
 * location are ever picked. Blocks are then chosen by priority until the time budget is used up.
 */
export function generatePlan(location: LocationId, focus: FocusId, budgetMin: number): Plan {
  const equipment = new Set<string>(locationById(location).equipment);
  const used = new Set<string>();
  const omitted: string[] = [];
  const candidates: Candidate[] = [];

  TEMPLATES[focus].forEach((tpl, order) => {
    const exercises: Exercise[] = [];
    let minutes = 0;
    for (const slot of tpl.slots) {
      const pick = slot.options.find(
        (opt) => available(opt.name, equipment) && (slot.repeat || !used.has(opt.name)),
      );
      if (!pick) {
        omitted.push(`${slot.options[0].name}: nicht verfügbar (Equipment)`);
        continue;
      }
      if (!slot.repeat) used.add(pick.name);
      exercises.push(toExercise(slot, pick, pick === slot.options[0] ? null : slot.options[0].name));
      minutes += slotMinutes(slot, pick);
    }
    if (exercises.length === 0) {
      omitted.push(`${tpl.name}: kein passendes Equipment`);
      return;
    }
    candidates.push({
      block: { name: tpl.name, type: tpl.type, exercises },
      priority: tpl.priority,
      order,
      minutes: tpl.fixedMin ?? Math.ceil(minutes),
    });
  });

  const chosen = new Set<Candidate>();
  let total = 0;
  for (const c of [...candidates].sort((a, b) => a.priority - b.priority || a.order - b.order)) {
    if (total + c.minutes <= budgetMin) {
      chosen.add(c);
      total += c.minutes;
    } else {
      omitted.push(`${c.block.name}: passt nicht ins Zeitbudget (${c.minutes} min)`);
    }
  }

  return {
    location,
    focus,
    budgetMin,
    blocks: candidates.filter((c) => chosen.has(c)).map((c) => c.block),
    estimatedMin: total,
    omitted,
  };
}
