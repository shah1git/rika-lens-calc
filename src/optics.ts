export interface Preset { label: string; w: number; h: number }
export interface AxisResult { ppm: number; err: number; mm100: number }
export interface PConfig { name: string; detI: number; pitchI: number; dispI: number }
export interface PCfgResult { h: AxisResult; v: AxisResult; score: number }

export function calcAxis(sR: number, dR: number, p: number, f: number): AxisResult {
  const r = sR / dR, ppm = f / (r * p), near = Math.round(ppm);
  const err = near > 0 ? (Math.abs(ppm - near) / ppm) * 100 : 100;
  return { ppm, err, mm100: (r * p * 100) / f };
}
