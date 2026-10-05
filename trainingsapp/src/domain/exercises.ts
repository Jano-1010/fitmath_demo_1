import type { Equipment, ExerciseDef, MuscleGroup, Unit } from "./types";

function ex(
  name: string,
  group: MuscleGroup,
  requires: Equipment[],
  opts: { weighted?: boolean; unit?: Unit } = {},
): ExerciseDef {
  return { name, group, requires, weighted: opts.weighted ?? true, unit: opts.unit ?? "reps" };
}

/** The fixed exercise list. Names are the key for history, so never free-type them. */
export const EXERCISES: ExerciseDef[] = [
  // Brust
  ex("Bankdrücken (Langhantel)", "chest", ["barbell", "bench"]),
  ex("Bankdrücken (Kurzhanteln)", "chest", ["dumbbell", "bench"]),
  ex("Schrägbankdrücken (Kurzhanteln)", "chest", ["dumbbell", "bench"]),
  ex("Brustpresse (Maschine)", "chest", ["machine"]),
  ex("Liegestütze", "chest", [], { weighted: false }),
  // Rücken
  ex("Klimmzüge", "back", ["pullupbar"]),
  ex("Latzug (Kabelzug)", "back", ["cable"]),
  ex("Sitzendes Kabelrudern", "back", ["cable"]),
  ex("Rudern vorgebeugt (Langhantel)", "back", ["barbell"]),
  ex("Einarmiges Kurzhantelrudern", "back", ["dumbbell"]),
  ex("Face Pulls (Kabelzug)", "back", ["cable"]),
  // Schultern
  ex("Schulterdrücken (Langhantel)", "shoulders", ["barbell"]),
  ex("Schulterdrücken (Kurzhanteln)", "shoulders", ["dumbbell"]),
  ex("Shoulder to Overhead (Langhantel)", "shoulders", ["barbell"]),
  ex("Seitheben (Kurzhanteln)", "shoulders", ["dumbbell"]),
  ex("Medizinball Ground to Overhead", "shoulders", ["medball"], { weighted: false }),
  ex("DB Ground to Overhead", "shoulders", ["dumbbell"]),
  // Arme
  ex("Trizepsdrücken (Kabelzug)", "arms", ["cable"]),
  ex("Bizeps-Curls (Kurzhanteln)", "arms", ["dumbbell"]),
  // Beine vorne
  ex("Kniebeuge (Langhantel)", "quads", ["barbell"]),
  ex("Frontkniebeuge (Langhantel)", "quads", ["barbell"]),
  ex("Goblet Squat (Kettlebell)", "quads", ["kettlebell"]),
  ex("Goblet Squat (Kurzhantel)", "quads", ["dumbbell"]),
  ex("Kniebeuge (Körpergewicht)", "quads", [], { weighted: false }),
  ex("Beinpresse (Maschine)", "quads", ["machine"]),
  ex("Ausfallschritte (Kurzhanteln)", "quads", ["dumbbell"]),
  ex("Bulgarische Split Squats (Kurzhanteln)", "quads", ["dumbbell", "bench"]),
  ex("Step-ups (Box, Kurzhanteln)", "quads", ["box", "dumbbell"]),
  ex("Ausfallschritte (Körpergewicht)", "quads", [], { weighted: false }),
  ex("Box Jumps", "quads", ["box"], { weighted: false }),
  ex("Sandbag Squats", "quads", ["sandbag"]),
  // Beine hinten
  ex("Kreuzheben (Langhantel)", "posterior", ["barbell"]),
  ex("Rumänisches Kreuzheben (Langhantel)", "posterior", ["barbell"]),
  ex("Hip Thrust (Langhantel)", "posterior", ["barbell", "bench"]),
  ex("Beinbeuger (Maschine)", "posterior", ["machine"]),
  ex("Kettlebell Swings", "posterior", ["kettlebell"]),
  ex("Hüftheben (Körpergewicht)", "posterior", [], { weighted: false }),
  // Waden
  ex("Wadenheben (Kurzhanteln)", "calves", ["dumbbell"]),
  // Rumpf
  ex("Hängendes Beinheben (Klimmzugstange)", "core", ["pullupbar"], { weighted: false }),
  ex("Hängendes Beinheben (Sprossenwand)", "core", ["wallbars"], { weighted: false }),
  ex("Russian Twist (Medizinball)", "core", ["medball"], { weighted: false }),
  ex("Sit-ups", "core", ["mats"], { weighted: false }),
  ex("Plank", "core", [], { weighted: false, unit: "s" }),
  // Ausdauer / Hyrox
  ex("Laufen", "cardio", [], { weighted: false, unit: "m" }),
  ex("Rudern (Ergometer)", "cardio", ["rower"], { weighted: false, unit: "cal" }),
  ex("Ski-Erg", "cardio", ["skierg"], { weighted: false, unit: "m" }),
  ex("Burpees über Bank", "cardio", ["bench"], { weighted: false }),
  ex("Burpees", "cardio", [], { weighted: false }),
  ex("Farmers Carry (Kettlebells)", "cardio", ["kettlebell"], { unit: "m" }),
  ex("Farmers Carry (Kurzhanteln)", "cardio", ["dumbbell"], { unit: "m" }),
  ex("Sandbag Carry", "cardio", ["sandbag"], { unit: "m" }),
];

const byName = new Map(EXERCISES.map((e) => [e.name, e]));

export function exerciseDef(name: string): ExerciseDef | undefined {
  return byName.get(name);
}

export const UNIT_LABEL: Record<Unit, string> = { reps: "Wdh.", m: "m", cal: "cal", s: "s" };
