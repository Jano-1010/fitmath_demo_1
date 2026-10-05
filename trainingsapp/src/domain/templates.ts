import type { BlockType, FocusId } from "./types";

/** One concrete exercise candidate for a template slot. Overrides apply only when this option is picked. */
export interface Option {
  name: string;
  sets?: number;
  reps?: string;
  note?: string;
  targetKg?: number;
  workSec?: number;
}

export interface Slot {
  /** Tried in order; the first one whose equipment is available at the location wins. */
  options: Option[];
  sets: number;
  reps: string;
  restSec: number;
  /** Seconds of work per set, used only for the time estimate. */
  workSec?: number;
  note?: string;
  /** Allow the same exercise to appear again in the plan (e.g. rowing at start and end of a MetCon). */
  repeat?: boolean;
  /** Mark fallbacks as "Ersatz für <first option>". */
  markSubstitute?: boolean;
}

export interface TemplateBlock {
  name: string;
  type: BlockType;
  /** 1 = most important. Low-priority blocks are dropped first when the time budget is tight. */
  priority: number;
  /** Fixed duration (e.g. a competition cap). Otherwise estimated from sets, work and rest. */
  fixedMin?: number;
  slots: Slot[];
}

export const DEFAULT_WORK_SEC = 45;

const o = (name: string, extra: Omit<Option, "name"> = {}): Option => ({ name, ...extra });
const opts = (...names: string[]): Option[] => names.map((n) => o(n));

const squatOptions = opts(
  "Kniebeuge (Langhantel)",
  "Beinpresse (Maschine)",
  "Goblet Squat (Kettlebell)",
  "Goblet Squat (Kurzhantel)",
  "Kniebeuge (Körpergewicht)",
);
const hingeOptions = opts(
  "Rumänisches Kreuzheben (Langhantel)",
  "Kettlebell Swings",
  "Hüftheben (Körpergewicht)",
);
const pressOptions = opts(
  "Schulterdrücken (Langhantel)",
  "Schulterdrücken (Kurzhanteln)",
  "Medizinball Ground to Overhead",
  "Liegestütze",
);
const pullOptions = opts("Klimmzüge", "Latzug (Kabelzug)");
const rowOptions = opts(
  "Rudern vorgebeugt (Langhantel)",
  "Einarmiges Kurzhantelrudern",
  "Sitzendes Kabelrudern",
);
const lungeOptions = opts(
  "Bulgarische Split Squats (Kurzhanteln)",
  "Step-ups (Box, Kurzhanteln)",
  "Ausfallschritte (Kurzhanteln)",
  "Ausfallschritte (Körpergewicht)",
);

export const TEMPLATES: Record<FocusId, TemplateBlock[]> = {
  upper: [
    {
      name: "Schwer: Druck und Zug",
      type: "heavy",
      priority: 1,
      slots: [
        {
          options: opts(
            "Bankdrücken (Langhantel)",
            "Bankdrücken (Kurzhanteln)",
            "Brustpresse (Maschine)",
            "Liegestütze",
          ),
          sets: 4,
          reps: "5",
          restSec: 150,
        },
        { options: pullOptions, sets: 4, reps: "6-8", restSec: 120 },
      ],
    },
    {
      name: "Schwer: Schulter und Rücken",
      type: "heavy",
      priority: 2,
      slots: [
        { options: pressOptions, sets: 3, reps: "6-8", restSec: 120 },
        { options: rowOptions, sets: 3, reps: "8-10", restSec: 90 },
      ],
    },
    {
      name: "Zusatz: Schulter und Arme",
      type: "accessory",
      priority: 3,
      slots: [
        {
          options: opts("Face Pulls (Kabelzug)", "Seitheben (Kurzhanteln)"),
          sets: 3,
          reps: "12-15",
          restSec: 60,
        },
        {
          options: opts("Trizepsdrücken (Kabelzug)", "Liegestütze"),
          sets: 3,
          reps: "10-12",
          restSec: 60,
        },
        { options: opts("Bizeps-Curls (Kurzhanteln)"), sets: 3, reps: "10-12", restSec: 60 },
      ],
    },
  ],
  lower: [
    {
      name: "Schwer: Kniebeuge und Hüftstreckung",
      type: "heavy",
      priority: 1,
      slots: [
        { options: squatOptions, sets: 4, reps: "5", restSec: 180 },
        { options: hingeOptions, sets: 3, reps: "8", restSec: 120 },
      ],
    },
    {
      name: "Zusatz: Einbeinig und Beinbeuger",
      type: "accessory",
      priority: 2,
      slots: [
        { options: lungeOptions, sets: 3, reps: "8-10", restSec: 90 },
        {
          options: opts("Beinbeuger (Maschine)", "Hip Thrust (Langhantel)", "Hüftheben (Körpergewicht)"),
          sets: 3,
          reps: "10-12",
          restSec: 90,
        },
      ],
    },
    {
      name: "Zusatz: Waden und Rumpf",
      type: "accessory",
      priority: 3,
      slots: [
        { options: opts("Wadenheben (Kurzhanteln)"), sets: 3, reps: "12-15", restSec: 60 },
        {
          options: opts(
            "Hängendes Beinheben (Klimmzugstange)",
            "Hängendes Beinheben (Sprossenwand)",
          ),
          sets: 3,
          reps: "10-12",
          restSec: 60,
        },
        { options: opts("Plank"), sets: 3, reps: "45", restSec: 45, workSec: 45 },
      ],
    },
  ],
  full: [
    {
      name: "Schwer: Kreuzheben und Schulter",
      type: "heavy",
      priority: 1,
      slots: [
        {
          options: opts("Kreuzheben (Langhantel)", "Kettlebell Swings", "Hüftheben (Körpergewicht)"),
          sets: 3,
          reps: "5",
          restSec: 180,
        },
        { options: pressOptions, sets: 3, reps: "6-8", restSec: 120 },
      ],
    },
    {
      name: "Schwer: Kniebeuge und Zug",
      type: "heavy",
      priority: 2,
      slots: [
        { options: squatOptions, sets: 3, reps: "6-8", restSec: 150 },
        { options: pullOptions, sets: 3, reps: "6-8", restSec: 120 },
      ],
    },
    {
      name: "Zusatz: Einbeinig und Rudern",
      type: "accessory",
      priority: 3,
      slots: [
        { options: lungeOptions, sets: 3, reps: "10", restSec: 90 },
        { options: rowOptions, sets: 3, reps: "10", restSec: 90 },
      ],
    },
    {
      name: "Finisher",
      type: "metcon",
      priority: 4,
      slots: [
        {
          options: [
            o("Rudern (Ergometer)", { reps: "30" }),
            o("Burpees über Bank", { reps: "10" }),
            o("Burpees", { reps: "10" }),
          ],
          sets: 3,
          reps: "30",
          restSec: 60,
          workSec: 90,
        },
      ],
    },
  ],
  athx: [
    {
      name: "Strength Zone: Shoulder to Overhead",
      type: "heavy",
      priority: 1,
      slots: [
        {
          options: [o("Shoulder to Overhead (Langhantel)")],
          sets: 5,
          reps: "2",
          restSec: 150,
          note: "Wettkampf: 1RM",
        },
      ],
    },
    {
      name: "MetCon X (Cap 25 min)",
      type: "metcon",
      priority: 2,
      fixedMin: 25,
      slots: [
        {
          options: [o("Rudern (Ergometer)")],
          sets: 1,
          reps: "45",
          restSec: 0,
          note: "Wettkampf: 45 cal",
        },
        {
          options: [
            o("DB Ground to Overhead", { targetKg: 20 }),
            o("Medizinball Ground to Overhead"),
          ],
          sets: 1,
          reps: "30",
          restSec: 0,
          note: "Wettkampf: 20 kg",
          markSubstitute: true,
        },
        {
          options: [o("Bankdrücken (Kurzhanteln)", { targetKg: 20 }), o("Liegestütze")],
          sets: 1,
          reps: "30",
          restSec: 0,
          note: "Wettkampf: 20 kg",
          markSubstitute: true,
        },
        {
          options: [
            o("Sandbag Squats", { targetKg: 50 }),
            o("Goblet Squat (Kettlebell)"),
            o("Goblet Squat (Kurzhantel)"),
            o("Kniebeuge (Körpergewicht)"),
          ],
          sets: 1,
          reps: "30",
          restSec: 0,
          note: "Wettkampf: Sandbag 50 kg",
          markSubstitute: true,
        },
        {
          options: [
            o("Sandbag Carry", { targetKg: 50 }),
            o("Farmers Carry (Kettlebells)"),
            o("Farmers Carry (Kurzhanteln)"),
          ],
          sets: 1,
          reps: "30",
          restSec: 0,
          note: "Wettkampf: Sandbag 50 kg, 30 m",
          markSubstitute: true,
        },
        {
          options: [o("Burpees über Bank"), o("Burpees")],
          sets: 1,
          reps: "30",
          restSec: 0,
          note: "Wettkampf: über Bank",
          markSubstitute: true,
        },
        {
          options: [o("Rudern (Ergometer)")],
          sets: 1,
          reps: "45",
          restSec: 0,
          note: "Wettkampf: 45 cal",
          repeat: true,
        },
      ],
    },
    {
      name: "Strength Zone: Back Squat",
      type: "heavy",
      priority: 3,
      slots: [
        {
          options: [o("Kniebeuge (Langhantel)")],
          sets: 4,
          reps: "2",
          restSec: 180,
          note: "Wettkampf: 2RM",
        },
      ],
    },
    {
      name: "Strength Zone: Kreuzheben",
      type: "heavy",
      priority: 4,
      slots: [
        {
          options: [o("Kreuzheben (Langhantel)")],
          sets: 3,
          reps: "3",
          restSec: 180,
          note: "Wettkampf: 3RM",
        },
      ],
    },
  ],
  endurance: [
    {
      name: "Endurance-Test (Cap 24 min)",
      type: "metcon",
      priority: 1,
      fixedMin: 24,
      slots: [
        {
          options: [o("Laufen")],
          sets: 1,
          reps: "3000",
          restSec: 0,
          note: "3 km, danach Ski-Erg",
        },
        {
          options: [o("Ski-Erg")],
          sets: 1,
          reps: "max",
          restSec: 0,
          note: "Maximale Distanz in der restlichen Zeit",
        },
      ],
    },
    {
      name: "Lauf-Intervalle",
      type: "metcon",
      priority: 2,
      slots: [
        { options: [o("Laufen")], sets: 5, reps: "800", restSec: 90, workSec: 240, repeat: true },
      ],
    },
    {
      name: "Hyrox-Stationen",
      type: "metcon",
      priority: 3,
      slots: [
        { options: [o("Rudern (Ergometer)")], sets: 3, reps: "40", restSec: 60, workSec: 120 },
        { options: [o("Ski-Erg")], sets: 3, reps: "250", restSec: 60, workSec: 70 },
        {
          options: opts("Farmers Carry (Kettlebells)", "Farmers Carry (Kurzhanteln)"),
          sets: 3,
          reps: "50",
          restSec: 60,
          workSec: 60,
        },
        {
          options: opts("Burpees über Bank", "Burpees"),
          sets: 3,
          reps: "10",
          restSec: 60,
          workSec: 30,
        },
      ],
    },
  ],
};
