import { useState } from "react";
import { C, iS, mn, sS, fS, type Align } from "./theme";

export function RikaLogo() {
  return (
    <svg viewBox="100 205 640 185" style={{ height: 28, width: "auto" }} xmlns="http://www.w3.org/2000/svg">
      <path fill="#f15a22" d="m529.11,271.13h12.32v-2.46h-12.32v2.46Zm17.24-2.46v2.46h12.32v-2.46h-12.32Zm-3.69,16.01h2.46v-12.32h-2.46v12.32Zm0-17.24h2.46v-12.32h-2.46v12.32Z"/>
      <path fill="#f15a22" d="m231.96,260.76c8.16-8.69,8.06-15.95,7.09-19.83-.41-1.63-2.25-2.41-3.7-1.57l-3.45,1.53s4.31-14.67.72-22.72c-1.26-2.82-.56-6.2-5.37-6.88-3.35-.47-5.63.95-12.42,7.33-2.43,2.28-20.5,18.68-20.5,18.68,0,0-1.85-4.97-5.93-5.65-10.57-1.75-31.19,19.84-44.26,37.82-15.63,21.5-31.03,35.59-31.03,35.59,0,0,5.02,6.03,14.22,5.23-25.49,29.68-21.2,73.78-21.2,73.78,0,0,7.3-9.36,17.11-16.25,9.84-6.92,17.74-8.9,17.74-8.9l-9.99,17.27s21.15,3.25,40.46-4.81c11.36-4.74,17.55-11.42,22.17-16.94l-.14,10.97s14.74-2.98,22.09-17.36l1.21,8.18s14.11-13.47,14.11-32.02c0-23.55-11.5-27.84-11.79-41.14-.24-11,7.82-16.96,12.85-22.32Z"/>
      <path fill="#fff" d="m218.61,254.11s5.18-6.65,8.31-17.03c3.02-10.02,1.17-17.7,1.17-17.7l-7.08,4.3,1.25-4.89c-6.12,5.67-12.3,11.28-18.37,17-2.58,2.43-4.98,5.02-7.38,7.6-1.88,2.03-1.63,3.8-3.59,5.76-2.88,2.61-8.21,2.25-12.62,5.59,2.08-4.35,6.14-8.85,10.49-10.76l-2.62-5.99s-7.08,1.9-15.61,11.65c-7.5,8.57-13.26,23.86-13.26,23.86,0,0,8.12-7.19,13.45-9.81,8.48-4.17,16.77-3.67,16.77-3.67,0,0-13.86,2.41-23.48,16.38-5.97,8.67-6.51,15.9-6.51,15.9,0,0,8.07-6.24,14.08-9.01,9.14-4.21,17.8-3.96,17.8-3.96,0,0-11.79,9.69-.74,29.83,10.13,18.46-.74,30.82-.74,30.82,0,0,13.44.12,20.7-11.84,4.9-8.06,2.46-15.44,2.46-15.44,0,0,2.55,1.64,4.36,5.52,1.67,3.58,2.29,8.69,2.29,8.69,0,0,3.06-4.92,3.06-11.07,0-11.9-10.56-20.38-10.56-32.74,0-6.93,2.43-13.63,13.6-23.51,8.43-7.46,8.34-14.51,8.34-14.51l-15.53,9.04Z"/>
      <path fill="#e0e4ec" d="m515.75,257.01c-.4-1.13-1.47-1.89-2.67-1.89h-35.58c-1.2,0-2.27.76-2.67,1.89l-22.67,64.31c-.08.23-.4.23-.49,0-3.49-9.3-9.46-17.39-17.13-23.44-.16-.13-.16-.36,0-.49,11.77-9.3,19.59-23.38,20.47-39.29.09-1.62-1.22-2.98-2.84-2.98h-17.33c-1.49,0-2.7,1.16-2.82,2.65-1.28,15.42-13.62,27.68-29.16,28.49-.82.04-1.52-.59-1.52-1.41l-.09-26.9c0-1.56-1.27-2.83-2.83-2.83h-18.43c-1.57,0-2.83,1.27-2.83,2.83v79.37c0,1.57,1.27,2.83,2.83,2.83h18.7c1.57,0,2.84-1.27,2.83-2.84l-.09-26.87c0-.84.68-1.47,1.52-1.42,15.52.85,28.05,13.09,29.35,28.49.13,1.49,1.33,2.64,2.82,2.64h34.18c1.21,0,2.28-.76,2.68-1.9l21.97-62.94c.44-1.27,2.23-1.27,2.68,0l12.88,36.88c.64,1.83-.71,3.75-2.65,3.77l-14.42.07c-1.56.01-2.81,1.28-2.81,2.83v18.45c0,1.57,1.27,2.83,2.83,2.83h44.59c3.91,0,6.65-3.87,5.35-7.55l-26.64-75.59Zm-211.47-1.89h-27.78c-1.57,0-2.83,1.27-2.83,2.83v14.3c0,3.62-2.94,6.56-6.56,6.56h-14.7c-1.57,0-2.83,1.27-2.83,2.83v55.67c0,1.57,1.27,2.83,2.83,2.83h18.71c1.57,0,2.83-1.27,2.83-2.83v-51.83c0-3.62,2.94-6.56,6.56-6.56h24.14c3.74,0,7.02,2.88,7.12,6.62.1,3.84-2.98,6.98-6.8,6.98h-16.2c-1.57,0-2.83,1.27-2.83,2.83v18.26c0,1.39,1.12,2.7,2.51,2.84,11.47,1.14,20.06,10.02,21.18,21.2.14,1.37,1.43,2.49,2.81,2.49h18.19c1.55,0,2.83-1.25,2.84-2.79.07-15.83-8.68-25.36-10.35-27.03-.14-.14-.12-.38.04-.5,7.15-5.6,11.75-14.32,11.75-24.1h0c0-16.91-13.71-30.61-30.61-30.61Zm59.4,0h-18.43c-1.57,0-2.83,1.27-2.83,2.83v79.37c0,1.57,1.27,2.83,2.83,2.83h18.7c1.57,0,2.84-1.27,2.83-2.84l-.26-79.37c0-1.56-1.27-2.83-2.83-2.83Zm369.51,0h-19.77c-1.21,0-2.28.76-2.68,1.9l-21.97,62.94c-.44,1.27-2.23,1.27-2.68,0l-21.97-62.94c-.4-1.14-1.47-1.9-2.68-1.9h-34.77c-1.57,0-2.83,1.27-2.83,2.83v43.56c0,1.38-1.77,1.95-2.57.82l-32.91-46.03c-.53-.74-1.39-1.19-2.31-1.19h-19.8c-1.57,0-2.83,1.27-2.83,2.83v79.37c0,1.57,1.27,2.83,2.83,2.83h18.7c1.57,0,2.84-1.27,2.83-2.84l-.15-43.77c0-1.38,1.77-1.95,2.57-.82l32.78,46.25c.53.75,1.39,1.2,2.31,1.2h20.07c1.57,0,2.84-1.27,2.83-2.84l-.15-44.41c0-1.6,2.22-1.98,2.75-.48l16.16,45.84c.4,1.13,1.47,1.89,2.67,1.89h35.58c1.2,0,2.27-.76,2.67-1.89l27.97-79.37c.65-1.84-.72-3.78-2.67-3.78Z"/>
    </svg>
  );
}

export function FlagRU() { return (<svg viewBox="0 0 60 40" style={fS}><rect width="60" height="13.33" fill="#FFF"/><rect y="13.33" width="60" height="13.34" fill="#0039A6"/><rect y="26.67" width="60" height="13.33" fill="#D52B1E"/></svg>); }
export function FlagEN() { return (<svg viewBox="0 0 60 40" style={fS}><rect width="60" height="40" fill="#FFF"/><text x="30" y="21" textAnchor="middle" dominantBaseline="central" fill="#000" fontSize="18" fontWeight="bold" fontFamily="sans-serif">EN</text></svg>); }
export function FlagCN() { return (<svg viewBox="0 0 60 40" style={fS}><rect width="60" height="40" fill="#DE2910"/><g fill="#FFDE00"><polygon points="10,4 11.2,7.6 15,7.6 12,9.8 13,13.4 10,11 7,13.4 8,9.8 5,7.6 8.8,7.6"/></g></svg>); }

export function LangSw({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const ls = [{ c: "en", F: FlagEN }, { c: "ru", F: FlagRU }, { c: "zh", F: FlagCN }];
  return (<div style={{ display: "flex", gap: 4 }}>{ls.map(({ c, F }) => (
    <button key={c} onClick={() => setLang(c)} style={{ background: lang === c ? "#ffffff18" : "transparent", border: lang === c ? "1px solid #ffffff33" : "1px solid transparent", borderRadius: 4, padding: "3px 5px", cursor: "pointer", lineHeight: 0, opacity: lang === c ? 1 : 0.5 }}><F /></button>
  ))}</div>);
}

export function PB({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (<div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 140, flex: "1 1 140px" }}>
    <label style={{ fontSize: 11, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
    {children}
    <span style={{ fontSize: 10, color: C.hint, lineHeight: 1.5, maxWidth: 220 }}>{hint}</span>
  </div>);
}

export function Sel<T>({ value, onChange, options, render }: { value: number; onChange: (v: number) => void; options: readonly T[]; render: (o: T) => string }) {
  return (<select value={value} onChange={e => onChange(Number(e.target.value))} style={iS}>
    {options.map((o, i) => <option key={i} value={i}>{render(o)}</option>)}
  </select>);
}

export function Nm({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const [draft, setDraft] = useState<string>(String(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) { setPrevValue(value); setDraft(String(value)); }
  return <input type="number" value={draft} min={min} max={max}
    onChange={e => setDraft(e.target.value)}
    onBlur={() => { const n = Math.max(min, Math.min(max, Number(draft) || min)); setPrevValue(n); setDraft(String(n)); onChange(n); }}
    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    style={{ ...iS, width: 90 }} />;
}

export function Cd({ title, children }: { title?: string; children: React.ReactNode }) {
  return (<div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 20px", marginBottom: 20 }}>
    {title && <div style={sS}>{title}</div>}
    {children}
  </div>);
}

export function TH({ children, align, w, color, tip, onClick }: { children?: React.ReactNode; align?: Align; w?: number; color?: string; tip?: string; onClick?: () => void }) {
  return (<th title={tip || undefined} onClick={onClick} style={{ padding: "10px", textAlign: align || "left", width: w, fontSize: 10, color: color || C.dim, fontWeight: 600, whiteSpace: "nowrap", fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.04em", cursor: onClick ? "pointer" : tip ? "help" : "default" }}>{children}</th>);
}
