import type { Preset } from "./optics";

export const DETECTOR_PRESETS: Preset[] = [{label:"256×192",w:256,h:192},{label:"384×288",w:384,h:288},{label:"640×480",w:640,h:480},{label:"640×512",w:640,h:512},{label:"1024×768",w:1024,h:768},{label:"1280×1024",w:1280,h:1024}];
export const DISPLAY_PRESETS: Preset[] = [{label:"640×480",w:640,h:480},{label:"1024×768",w:1024,h:768},{label:"1280×1024",w:1280,h:1024},{label:"1920×1080",w:1920,h:1080},{label:"2560×2560",w:2560,h:2560}];
export const PITCH_OPTIONS = [12, 15, 17, 25];
export const CMP_COLORS = ["#00ccff", "#ff66ff", "#ffcc00", "#00ff88", "#ff6644", "#aa88ff", "#88ddff", "#ffaa33", "#ff4488"];
export const DISTANCES = [100, 200, 300, 500, 700, 1000];

export function parseHash(): Record<string, string> {
  try {
    const p: Record<string, string> = {};
    window.location.hash.slice(1).split('&').forEach(s => {
      const [k, v] = s.split('=');
      if (k && v) p[k] = v;
    });
    return p;
  } catch {
    return {};
  }
}

export const C = {
  bg: "#050505", card: "#0e0e0e", border: "#222", text: "#e8e8e8", dim: "#888", label: "#aaa", hint: "#666",
  green: "#00ff88", yellow: "#ffcc00", red: "#ff3344", H: "#00ccff", V: "#ff66ff",
  xBg: "#0c1a14", xBrd: "#1a3a28",
};

export function sc(p: number) { return p < 1 ? C.green : p < 5 ? C.yellow : C.red; }
export function sbg(p: number) { return p < 1 ? "#00ff8810" : p < 5 ? "#ffcc0008" : "transparent"; }

export const mn = "'JetBrains Mono', monospace";
export const sS: React.CSSProperties = { fontSize: 11, color: C.label, marginBottom: 14, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.1em" };
export const iS: React.CSSProperties = { background: "#080808", color: "#e8e8e8", border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px", fontSize: 14, fontFamily: mn, cursor: "pointer", outline: "none" };
export const fS: React.CSSProperties = { height: 16, width: 24, borderRadius: 2, display: "block" };

export type Align = "left" | "right" | "center";
export function td(a: Align, w?: number): React.CSSProperties {
  return { padding: "7px 10px", textAlign: a, color: C.text, whiteSpace: "nowrap", ...(w ? { width: w } : {}) };
}
