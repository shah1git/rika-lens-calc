export interface Preset { label: string; w: number; h: number }
export interface AxisResult { ppm: number; err: number; mm100: number }
export interface RowResult { f: number; h: AxisResult; v: AxisResult; score: number }
export type SortMode = "both" | "vPriority" | "vOnly";
export interface PConfig { name: string; detI: number; pitchI: number; dispI: number }
export interface PCfgResult { h: AxisResult; v: AxisResult; score: number }

export function calcAxis(sR: number, dR: number, p: number, f: number): AxisResult {
  const r = sR / dR, ppm = f / (r * p), near = Math.round(ppm);
  const err = near > 0 ? (Math.abs(ppm - near) / ppm) * 100 : 100;
  return { ppm, err, mm100: (r * p * 100) / f };
}
export function getScore(h: AxisResult, v: AxisResult, mode: SortMode): number {
  return mode === "both" ? Math.max(h.err, v.err) : v.err;
}
export function sortRows(rows: RowResult[], mode: SortMode): RowResult[] {
  return [...rows].sort((a, b) => {
    if (mode === "vPriority") { const d = a.v.err - b.v.err; if (Math.abs(d) > 0.001) return d; return a.h.err - b.h.err; }
    return a.score - b.score;
  });
}
export function findMultiples(ep: number, lo: number, hi: number): number[] {
  const r: number[] = [];
  for (let f = lo; f <= hi; f++) if (Math.abs(f / ep - Math.round(f / ep)) < 0.0001) r.push(f);
  return r;
}
