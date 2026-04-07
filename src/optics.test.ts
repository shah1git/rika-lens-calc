import { describe, it, expect } from "vitest";
import { calcAxis } from "./optics";

describe("calcAxis", () => {
  it("computes px/mrad as F ÷ (sensor/display × pitch)", () => {
    // 640/1024 × 12µm = 7.5µm effective pitch; F=75 → 10 px/mrad
    const r = calcAxis(640, 1024, 12, 75);
    expect(r.ppm).toBeCloseTo(10, 4);
    expect(r.err).toBeLessThan(0.001);
  });

  it("reports ~0% error when px/mrad is an integer", () => {
    // F=75, 640→1024 display, pitch 12 → ppm=10.0 exactly
    const r = calcAxis(640, 1024, 12, 75);
    expect(r.err).toBeLessThan(0.001);
  });

  it("reports non-zero error when px/mrad is fractional", () => {
    // F=40 → ppm = 40/7.5 = 5.333..., nearest int 5, err ≈ 6.25%
    const r = calcAxis(640, 1024, 12, 40);
    expect(r.ppm).toBeCloseTo(5.333, 2);
    expect(r.err).toBeGreaterThan(6);
    expect(r.err).toBeLessThan(7);
  });

  it("computes mm100 (pixel size at 100m) correctly", () => {
    // F=75 → 1 pixel covers (sensor/display) × pitch × 100 / F = 7.5 × 100 / 75 = 10 mm
    const r = calcAxis(640, 1024, 12, 75);
    expect(r.mm100).toBeCloseTo(10, 4);
  });

  it("mm100 scales inversely with F", () => {
    const r1 = calcAxis(640, 1024, 12, 50);
    const r2 = calcAxis(640, 1024, 12, 100);
    expect(r1.mm100 / r2.mm100).toBeCloseTo(2, 4);
  });

  it("returns err=100 when ppm rounds to 0 (degenerate case)", () => {
    // F=1 with 7.5µm effective pitch → ppm ≈ 0.133 → near=0
    const r = calcAxis(640, 1024, 12, 1);
    expect(r.err).toBe(100);
  });

  it("handles sensor/display aspect match producing integer scale", () => {
    // Same aspect: 640/1280=0.5, pitch 10 → eff pitch 5µm
    // F=10 → ppm = 10/5 = 2 exactly
    const r = calcAxis(640, 1280, 10, 10);
    expect(r.ppm).toBeCloseTo(2, 6);
    expect(r.err).toBeLessThan(0.001);
  });

  it("ppm and mm100 follow reciprocal relationship", () => {
    // At ppm=10, 1 pixel covers 0.1 mrad → at 100m = 10mm
    // At ppm=5, 1 pixel covers 0.2 mrad → at 100m = 20mm
    const r1 = calcAxis(640, 1024, 12, 75);  // ppm=10, mm100=10
    const r2 = calcAxis(640, 1024, 12, 37.5); // ppm=5, mm100=20
    expect(r1.ppm * r1.mm100).toBeCloseTo(r2.ppm * r2.mm100, 4);
  });
});
