/** Epley: kg * (1 + reps / 30). Returns 0 for entries that carry no load or no reps. */
export function estimateE1RM(weightKg: number, reps: number): number {
  if (!(weightKg > 0) || !(reps > 0)) return 0;
  return weightKg * (1 + reps / 30);
}
