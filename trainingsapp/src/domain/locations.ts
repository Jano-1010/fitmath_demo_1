import type { Equipment, FocusId, LocationId } from "./types";

export interface LocationDef {
  id: LocationId;
  label: string;
  equipment: Equipment[];
}

/** Single source of truth for what each location offers. Edit here if a gym gets new equipment. */
export const LOCATIONS: LocationDef[] = [
  {
    id: "gym_full",
    label: "Gym",
    equipment: ["barbell", "dumbbell", "cable", "rower", "skierg", "kettlebell", "machine", "box"],
  },
  {
    id: "school_gym",
    label: "Schulgym",
    equipment: ["barbell", "dumbbell", "cable", "pullupbar", "bench", "mats"],
  },
  {
    id: "minimal",
    label: "Homegym",
    equipment: ["wallbars", "medball", "pullupbar"],
  },
];

export const FOCI: { id: FocusId; label: string }[] = [
  { id: "upper", label: "Oberkörper" },
  { id: "lower", label: "Unterkörper" },
  { id: "full", label: "Ganzkörper" },
  { id: "athx", label: "ATHX" },
  { id: "endurance", label: "Ausdauer" },
];

export const BUDGETS = [30, 45, 60] as const;

export function locationById(id: LocationId): LocationDef {
  const loc = LOCATIONS.find((l) => l.id === id);
  if (!loc) throw new Error(`Unknown location ${id}`);
  return loc;
}

export const locationLabel = (id: LocationId) => locationById(id).label;
export const focusLabel = (id: FocusId) => FOCI.find((f) => f.id === id)?.label ?? id;
