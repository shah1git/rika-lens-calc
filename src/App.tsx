import { useState, useMemo, useEffect, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { T, LANG_KEY } from "./i18n";
import type { Preset, RowResult, SortMode, PConfig, PCfgResult } from "./optics";
import { calcAxis, getScore, sortRows, findMultiples } from "./optics";
import { DETECTOR_PRESETS, DISPLAY_PRESETS, PITCH_OPTIONS, CMP_COLORS, DISTANCES, parseHash, C, sc, sbg, mn, sS, iS, td, PB, Sel, Nm, Cd, TH, CTip, RikaLogo, LangSw, SortModePanel, Explain } from "./ui";

const _hp = parseHash();

export default function App() {
  const [lang, setLang] = useState(() => { if (_hp.lang && T[_hp.lang]) return _hp.lang; try { return localStorage.getItem(LANG_KEY) || "en"; } catch { return "en"; } });
  const t = (k: string) => T[lang]?.[k] ?? T.en[k] ?? k;
  const tip = t;
  const cTip = (type: string, v: string, d: number): string => {
    const m: Record<string, Record<string, string>> = {
      pixH: { ru: `${v} мм — один пиксель дисплея покрывает ${v} мм по горизонтали на дистанции ${d}м. Объект меньше ${v} мм будет занимать менее 1 пикселя.`, en: `${v} mm — one display pixel covers ${v} mm horizontally at ${d}m. An object smaller than ${v} mm fits in less than 1 pixel.`, zh: `${v} mm — 在${d}m处一个显示像素水平覆盖${v}mm。小于${v}mm的目标不到1个像素。` },
      pixV: { ru: `${v} мм — один пиксель дисплея покрывает ${v} мм по вертикали на дистанции ${d}м. Объект меньше ${v} мм будет занимать менее 1 пикселя.`, en: `${v} mm — one display pixel covers ${v} mm vertically at ${d}m. An object smaller than ${v} mm fits in less than 1 pixel.`, zh: `${v} mm — 在${d}m处一个显示像素垂直覆盖${v}mm。小于${v}mm的目标不到1个像素。` },
      errH: { ru: `${v} мм — штрих сетки сдвинут на ${v} мм по горизонтали от идеального положения на ${d}м. Это ошибка ветровой поправки.`, en: `${v} mm — reticle mark shifted ${v} mm horizontally from ideal at ${d}m. This is the windage correction error.`, zh: `${v} mm — 在${d}m处瞄准线水平偏移${v}mm。这是风偏修正误差。` },
      errV: { ru: `${v} мм — штрих сетки сдвинут на ${v} мм по вертикали от идеального положения на ${d}м. Это ошибка баллистической поправки (holdover).`, en: `${v} mm — reticle mark shifted ${v} mm vertically from ideal at ${d}m. This is the holdover correction error.`, zh: `${v} mm — 在${d}m处瞄准线垂直偏移${v}mm。这是弹道修正误差。` },
      dist: { ru: `Дистанция ${d} метров. 1 мрад на ${d}м = ${d} мм.`, en: `Distance ${d} meters. 1 mrad at ${d}m = ${d} mm.`, zh: `距离${d}米。${d}m处1mrad=${d}mm。` },
    };
    return m[type]?.[lang] ?? m[type]?.en ?? '';
  };
  const cellTip = (col: string, r: RowResult, sv: number): string => {
    const sH = (det.w / disp.w).toFixed(4), sV = (det.h / disp.h).toFixed(4), p = String(pitch);
    const nH = Math.round(r.h.ppm), nV = Math.round(r.v.ppm);
    const fH = (r.h.ppm - nH).toFixed(3);
    const dH = (r.h.err / 100 * 500).toFixed(2), dV = (r.v.err / 100 * 500).toFixed(2);
    const m: Record<string, Record<string, string>> = {
      f: {
        ru: `F = ${r.f} мм — фокусное расстояние объектива. Определяет угол поля зрения и масштаб изображения. Чем больше F — тем уже поле зрения, крупнее цель, но меньше обзор. При F=${r.f} один пиксель дисплея соответствует ${r.h.mm100.toFixed(2)} мм по горизонтали и ${r.v.mm100.toFixed(2)} мм по вертикали на 100 м.`,
        en: `F = ${r.f} mm — objective focal length. Determines field of view and image scale. Larger F = narrower FOV, bigger target, less overview. At F=${r.f}, one display pixel covers ${r.h.mm100.toFixed(2)} mm horizontally and ${r.v.mm100.toFixed(2)} mm vertically at 100 m.`,
        zh: `F = ${r.f} mm — 物镜焦距。决定视场角和图像比例。F越大视场越窄，目标越大。F=${r.f}时，100m处一个显示像素覆盖水平${r.h.mm100.toFixed(2)}mm、垂直${r.v.mm100.toFixed(2)}mm。`,
      },
      ppmH: {
        ru: `${r.h.ppm.toFixed(3)} — столько пикселей дисплея приходится на 1 миллирадиан по горизонтали при F=${r.f} мм. Рассчитано: F ÷ (масштаб_H × шаг_пикселя) = ${r.f} ÷ (${sH} × ${p}) = ${r.h.ppm.toFixed(3)}. Идеал — целое число (${nH}). Дробная часть ${fH} вызывает неравномерность штрихов.`,
        en: `${r.h.ppm.toFixed(3)} — display pixels per 1 milliradian horizontally at F=${r.f} mm. Calculated: F ÷ (scale_H × pixel_pitch) = ${r.f} ÷ (${sH} × ${p}) = ${r.h.ppm.toFixed(3)}. Ideal is integer (${nH}). Fractional part ${fH} causes uneven mark spacing.`,
        zh: `${r.h.ppm.toFixed(3)} — F=${r.f}mm时水平每毫弧度的显示像素数。计算：F÷(缩放H×像素间距)=${r.f}÷(${sH}×${p})=${r.h.ppm.toFixed(3)}。理想值为整数(${nH})。小数部分${fH}导致标记间距不均。`,
      },
      errH: {
        ru: `${r.h.err.toFixed(2)}% — ошибка округления по горизонтали. Показывает насколько px/мрад (${r.h.ppm.toFixed(3)}) отличается от ближайшего целого (${nH}). Рассчитано: |${r.h.ppm.toFixed(3)} − ${nH}| ÷ ${r.h.ppm.toFixed(3)} × 100% = ${r.h.err.toFixed(2)}%. На 500 м это сдвиг штриха на ${dH} мм. Влияет на точность ветровых поправок.`,
        en: `${r.h.err.toFixed(2)}% — horizontal rounding error. Shows how far px/mrad (${r.h.ppm.toFixed(3)}) is from nearest integer (${nH}). Calculated: |${r.h.ppm.toFixed(3)} − ${nH}| ÷ ${r.h.ppm.toFixed(3)} × 100% = ${r.h.err.toFixed(2)}%. At 500m this shifts a mark by ${dH} mm. Affects windage correction accuracy.`,
        zh: `${r.h.err.toFixed(2)}% — 水平舍入误差。px/mrad(${r.h.ppm.toFixed(3)})与最近整数(${nH})的偏差。计算：|${r.h.ppm.toFixed(3)}−${nH}|÷${r.h.ppm.toFixed(3)}×100%=${r.h.err.toFixed(2)}%。500m处标记偏移${dH}mm。影响风偏修正精度。`,
      },
      ppmV: {
        ru: `${r.v.ppm.toFixed(3)} — столько пикселей дисплея приходится на 1 миллирадиан по вертикали при F=${r.f} мм. Рассчитано: F ÷ (масштаб_V × шаг_пикселя) = ${r.f} ÷ (${sV} × ${p}) = ${r.v.ppm.toFixed(3)}. Идеал — целое число (${nV}). Вертикальная ось критична для баллистических поправок.`,
        en: `${r.v.ppm.toFixed(3)} — display pixels per 1 milliradian vertically at F=${r.f} mm. Calculated: F ÷ (scale_V × pixel_pitch) = ${r.f} ÷ (${sV} × ${p}) = ${r.v.ppm.toFixed(3)}. Ideal is integer (${nV}). Vertical axis is critical for ballistic corrections.`,
        zh: `${r.v.ppm.toFixed(3)} — F=${r.f}mm时垂直每毫弧度的显示像素数。计算：F÷(缩放V×像素间距)=${r.f}÷(${sV}×${p})=${r.v.ppm.toFixed(3)}。理想值为整数(${nV})。垂直轴对弹道修正至关重要。`,
      },
      errV: {
        ru: `${r.v.err.toFixed(2)}% — ошибка округления по вертикали. Показывает насколько px/мрад (${r.v.ppm.toFixed(3)}) отличается от ближайшего целого (${nV}). Рассчитано: |${r.v.ppm.toFixed(3)} − ${nV}| ÷ ${r.v.ppm.toFixed(3)} × 100% = ${r.v.err.toFixed(2)}%. На 500 м это сдвиг штриха на ${dV} мм. Критично: влияет на точность holdover и mil-ranging.`,
        en: `${r.v.err.toFixed(2)}% — vertical rounding error. Shows how far px/mrad (${r.v.ppm.toFixed(3)}) is from nearest integer (${nV}). Calculated: |${r.v.ppm.toFixed(3)} − ${nV}| ÷ ${r.v.ppm.toFixed(3)} × 100% = ${r.v.err.toFixed(2)}%. At 500m this shifts a mark by ${dV} mm. Critical: affects holdover and mil-ranging accuracy.`,
        zh: `${r.v.err.toFixed(2)}% — 垂直舍入误差。px/mrad(${r.v.ppm.toFixed(3)})与最近整数(${nV})的偏差。500m处标记偏移${dV}mm。关键：影响弹道修正和测距精度。`,
      },
      worst: sm === "both" ? {
        ru: `${sv.toFixed(2)}% — итоговая ошибка = максимум из H (${r.h.err.toFixed(2)}%) и V (${r.v.err.toFixed(2)}%). Сетка ровная только когда обе оси дают малую ошибку. ${sv < 1 ? 'Отличный результат — ошибка менее 1%.' : sv < 5 ? 'Допустимый результат.' : 'Заметное плавание штрихов.'}`,
        en: `${sv.toFixed(2)}% — overall error = max of H (${r.h.err.toFixed(2)}%) and V (${r.v.err.toFixed(2)}%). Reticle is even only when both axes have low error. ${sv < 1 ? 'Excellent — error under 1%.' : sv < 5 ? 'Acceptable result.' : 'Noticeable mark drift.'}`,
        zh: `${sv.toFixed(2)}% — 总误差=H(${r.h.err.toFixed(2)}%)和V(${r.v.err.toFixed(2)}%)的最大值。${sv < 1 ? '优秀——误差低于1%。' : sv < 5 ? '可接受。' : '明显标记漂移。'}`,
      } : sm === "vPriority" ? {
        ru: `${sv.toFixed(2)}% — ошибка по вертикали (приоритетная ось). H = ${r.h.err.toFixed(2)}% учитывается как вторичный критерий при равных V. ${sv < 1 ? 'Отличный результат.' : sv < 5 ? 'Допустимо.' : 'Заметная ошибка по вертикали.'}`,
        en: `${sv.toFixed(2)}% — vertical error (priority axis). H = ${r.h.err.toFixed(2)}% used as tiebreaker. ${sv < 1 ? 'Excellent.' : sv < 5 ? 'Acceptable.' : 'Noticeable vertical error.'}`,
        zh: `${sv.toFixed(2)}% — 垂直误差（优先轴）。H=${r.h.err.toFixed(2)}%作为次要排序。${sv < 1 ? '优秀。' : sv < 5 ? '可接受。' : '明显垂直误差。'}`,
      } : {
        ru: `${sv.toFixed(2)}% — ошибка только по вертикали. Горизонталь (${r.h.err.toFixed(2)}%) не влияет на рейтинг. ${sv < 1 ? 'Отличный результат.' : sv < 5 ? 'Допустимо.' : 'Заметная ошибка.'}`,
        en: `${sv.toFixed(2)}% — vertical error only. Horizontal (${r.h.err.toFixed(2)}%) does not affect ranking. ${sv < 1 ? 'Excellent.' : sv < 5 ? 'Acceptable.' : 'Noticeable error.'}`,
        zh: `${sv.toFixed(2)}% — 仅垂直误差。水平(${r.h.err.toFixed(2)}%)不影响排名。${sv < 1 ? '优秀。' : sv < 5 ? '可接受。' : '明显误差。'}`,
      },
      mmH: {
        ru: `${r.h.mm100.toFixed(2)} мм — линейный размер одного пикселя дисплея по горизонтали на дистанции 100 м. Объект размером ${r.h.mm100.toFixed(2)} мм займёт ровно 1 пиксель. На 500 м этот же пиксель покроет ${(r.h.mm100 * 5).toFixed(2)} мм, на 1000 м — ${(r.h.mm100 * 10).toFixed(2)} мм. Чем меньше — тем выше разрешение системы.`,
        en: `${r.h.mm100.toFixed(2)} mm — linear size of one display pixel horizontally at 100 m. An object ${r.h.mm100.toFixed(2)} mm wide fills exactly 1 pixel. At 500m this pixel covers ${(r.h.mm100 * 5).toFixed(2)} mm, at 1000m — ${(r.h.mm100 * 10).toFixed(2)} mm. Smaller = higher resolution.`,
        zh: `${r.h.mm100.toFixed(2)} mm — 100m处一个显示像素的水平线性尺寸。${r.h.mm100.toFixed(2)}mm宽的目标恰好占1像素。500m处覆盖${(r.h.mm100 * 5).toFixed(2)}mm，1000m处覆盖${(r.h.mm100 * 10).toFixed(2)}mm。越小分辨率越高。`,
      },
      mmV: {
        ru: `${r.v.mm100.toFixed(2)} мм — линейный размер одного пикселя дисплея по вертикали на дистанции 100 м. Объект высотой ${r.v.mm100.toFixed(2)} мм займёт ровно 1 пиксель. На 500 м — ${(r.v.mm100 * 5).toFixed(2)} мм, на 1000 м — ${(r.v.mm100 * 10).toFixed(2)} мм. Определяет минимальную видимую деталь по вертикали.`,
        en: `${r.v.mm100.toFixed(2)} mm — linear size of one display pixel vertically at 100 m. An object ${r.v.mm100.toFixed(2)} mm tall fills exactly 1 pixel. At 500m — ${(r.v.mm100 * 5).toFixed(2)} mm, at 1000m — ${(r.v.mm100 * 10).toFixed(2)} mm. Determines minimum visible vertical detail.`,
        zh: `${r.v.mm100.toFixed(2)} mm — 100m处一个显示像素的垂直线性尺寸。高${r.v.mm100.toFixed(2)}mm的目标恰好占1像素。500m处${(r.v.mm100 * 5).toFixed(2)}mm，1000m处${(r.v.mm100 * 10).toFixed(2)}mm。决定最小可见垂直细节。`,
      },
    };
    return m[col]?.[lang] ?? m[col]?.en ?? '';
  };
  const cl = (l: string) => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch {} };
  const [dI, setDI] = useState(() => { const v = Number(_hp.det); return v >= 0 && v < DETECTOR_PRESETS.length ? v : 3; });
  const [dpI, setDpI] = useState(() => { const v = Number(_hp.disp); return v >= 0 && v < DISPLAY_PRESETS.length ? v : 1; });
  const [pI, setPI] = useState(() => { const v = Number(_hp.pitch); return v >= 0 && v < PITCH_OPTIONS.length ? v : 0; });
  const [fF, setFF] = useState(() => { const v = Number(_hp.from); return v >= 5 && v <= 200 ? v : 20; });
  const [fT, setFT] = useState(() => { const v = Number(_hp.to); return v >= 5 && v <= 200 ? v : 75; });
  const [sm, setSm] = useState<SortMode>(() => (["both", "vPriority", "vOnly"] as SortMode[]).includes(_hp.mode as SortMode) ? _hp.mode as SortMode : "both");
  const [copied, setCopied] = useState(false);
  const [compared, setCompared] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Tab
  const [tab, setTab] = useState<"single"|"portfolio">(() => _hp.tab === "portfolio" ? "portfolio" : "single");

  // Portfolio state
  const isPortfolio = _hp.tab === "portfolio";
  const [pCfg, setPCfg] = useState<PConfig[]>(() => {
    if (!isPortfolio) return [{ name: "", detI: 3, pitchI: 0, dispI: 1 }, { name: "", detI: 1, pitchI: 0, dispI: 0 }];
    const cfgs: PConfig[] = [];
    for (let i = 1; i <= 6; i++) {
      const c = _hp[`c${i}`];
      if (c) { const [d, p, dp] = c.split(",").map(Number);
        if (d >= 0 && d < DETECTOR_PRESETS.length && p >= 0 && p < PITCH_OPTIONS.length && dp >= 0 && dp < DISPLAY_PRESETS.length)
          cfgs.push({ name: decodeURIComponent(_hp[`n${i}`] || ""), detI: d, pitchI: p, dispI: dp });
      }
    }
    return cfgs.length >= 2 ? cfgs : [{ name: "", detI: 3, pitchI: 0, dispI: 1 }, { name: "", detI: 1, pitchI: 0, dispI: 0 }];
  });
  const [pFF, setPFF] = useState(() => { if (!isPortfolio) return 20; const v = Number(_hp.from); return v >= 5 && v <= 200 ? v : 20; });
  const [pFT, setPFT] = useState(() => { if (!isPortfolio) return 75; const v = Number(_hp.to); return v >= 5 && v <= 200 ? v : 75; });
  const [portfolio, setPortfolio] = useState<number[]>(() => {
    if (!isPortfolio || !_hp.pf) return [];
    return _hp.pf.split(",").map(Number).filter(n => n >= 5 && n <= 200);
  });
  const [pThr, setPThr] = useState(() => { const v = Number(_hp.thr); return v >= 0.1 && v <= 10 ? v : 1; });
  const [pExp, setPExp] = useState<number | null>(null);
  const [pSort, setPSort] = useState<string>(() => {
    if (_hp.tab !== "portfolio") return "max";
    const s = _hp.sort;
    if (s === "max" || s === "cov") return s;
    if (s && /^c\d+$/.test(s)) return s;
    return "max";
  });

  useEffect(() => {
    if (tab === "single") {
      window.location.hash = `tab=single&det=${dI}&disp=${dpI}&pitch=${pI}&from=${fF}&to=${fT}&mode=${sm}&lang=${lang}`;
    } else {
      const cs = pCfg.map((c, i) => `c${i+1}=${c.detI},${c.pitchI},${c.dispI}`).join("&");
      const ns = pCfg.map((c, i) => c.name ? `n${i+1}=${encodeURIComponent(c.name)}` : "").filter(Boolean).join("&");
      const pf = portfolio.length ? `&pf=${portfolio.join(",")}` : "";
      const hashMode = sm === "both" ? "vOnly" : sm;
      window.location.hash = `tab=portfolio&from=${pFF}&to=${pFT}&mode=${hashMode}&thr=${pThr}&sort=${pSort}&lang=${lang}&${cs}${ns ? "&" + ns : ""}${pf}`;
    }
  }, [tab, dI, dpI, pI, fF, fT, pFF, pFT, sm, pThr, pSort, lang, pCfg, portfolio]);

  const copyLink = () => { navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const det = DETECTOR_PRESETS[dI], disp = DISPLAY_PRESETS[dpI], pitch = PITCH_OPTIONS[pI];
  const lo = Math.min(fF, fT), hi = Math.max(fF, fT);
  const results = useMemo(() => Array.from({ length: hi - lo + 1 }, (_, i) => {
    const f = lo + i, h = calcAxis(det.w, disp.w, pitch, f), v = calcAxis(det.h, disp.h, pitch, f);
    return { f, h, v, score: getScore(h, v, sm) };
  }), [det, disp, pitch, lo, hi, sm]);
  const sorted = useMemo(() => sortRows(results, sm), [results, sm]);
  const top5 = useMemo(() => new Set(sorted.slice(0, 5).map(r => r.f)), [sorted]);
  const chart = useMemo(() => [...results].sort((a, b) => a.f - b.f).map(r => ({ f: r.f, eH: r.h.err, eV: r.v.err, w: r.score })), [results]);
  const rH = det.w / disp.w, rV = det.h / disp.h, eH = rH * pitch, eV = rV * pitch;
  const aspOk = Math.abs(rH - rV) / Math.max(rH, rV) < 0.001;
  const mulH = findMultiples(eH, lo, hi), mulV = findMultiples(eV, lo, hi);

  const pLo = Math.min(pFF, pFT), pHi = Math.max(pFF, pFT);
  const pResults = useMemo(() => Array.from({ length: pHi - pLo + 1 }, (_, i) => {
    const f = pLo + i;
    const cfgs: PCfgResult[] = pCfg.map(cfg => {
      const d = DETECTOR_PRESETS[cfg.detI], dp = DISPLAY_PRESETS[cfg.dispI], p = PITCH_OPTIONS[cfg.pitchI];
      const h = calcAxis(d.w, dp.w, p, f), v = calcAxis(d.h, dp.h, p, f);
      return { h, v, score: v.err };
    });
    return { f, cfgs };
  }), [pCfg, pLo, pHi]);

  const pMode: "vOnly" | "vPriority" = sm === "both" ? "vOnly" : sm as "vOnly" | "vPriority";
  const pSorted = useMemo(() => {
    const rows = pResults.map(row => {
      const aggregate = Math.max(...row.cfgs.map(c => c.v.err));
      const aggH = Math.max(...row.cfgs.map(c => c.h.err));
      const coverage = row.cfgs.filter(c => c.score <= pThr).length;
      return { ...row, aggregate, aggH, coverage };
    });
    return rows.sort((a, b) => {
      if (pSort === "cov") {
        const d = b.coverage - a.coverage;
        if (d !== 0) return d;
        return a.aggregate - b.aggregate;
      }
      if (pSort.startsWith("c") && pSort !== "cov") {
        const ci = parseInt(pSort.slice(1)) - 1;
        if (ci >= 0 && ci < a.cfgs.length) {
          const d = a.cfgs[ci].v.err - b.cfgs[ci].v.err;
          if (pMode === "vPriority" && Math.abs(d) < 0.001) return a.cfgs[ci].h.err - b.cfgs[ci].h.err;
          return d;
        }
      }
      const d = a.aggregate - b.aggregate;
      if (pMode === "vPriority" && Math.abs(d) < 0.001) return a.aggH - b.aggH;
      return d;
    });
  }, [pResults, pMode, pSort, pThr]);

  return (<div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI',system-ui,sans-serif", padding: "0 16px 40px" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 0 20px", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        <RikaLogo /><h1 style={{ flex: 1, fontSize: 18, fontWeight: 700, margin: 0, color: "#fff", fontFamily: mn }}>{t("title")} <span style={{ fontSize: 11, fontWeight: 400, color: C.hint }}>v6.0.0</span></h1><button onClick={copyLink} style={{ background: copied ? "#00ff8818" : "#ffffff08", border: `1px solid ${copied ? C.green : C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, color: copied ? C.green : C.dim, cursor: "pointer", fontFamily: mn, whiteSpace: "nowrap" }}>{copied ? t("linkCopied") : t("copyLink")}</button><LangSw lang={lang} setLang={cl} />
      </div>
      {/* Tab buttons */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0 20px" }}>
        {(["single", "portfolio"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            background: tab === tb ? "#00ff8812" : "transparent",
            border: `1.5px solid ${tab === tb ? C.green : C.border}`,
            borderRadius: 6, padding: "10px 18px", cursor: "pointer", flex: "1 1 200px", textAlign: "left",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tab === tb ? C.green : C.dim, fontFamily: mn }}>{t(tb === "single" ? "tabSingle" : "tabPortfolio")}</div>
          </button>
        ))}
      </div>
      {tab === "single" && <>
      <p style={{ fontSize: 16, color: C.text, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 720, fontWeight: 500 }}>{t("subtitle")}</p>

      <Cd title={t("params")}><div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <PB label={t("detector")} hint={t("detectorHint")}><Sel value={dI} onChange={setDI} options={DETECTOR_PRESETS} render={(p: Preset) => p.label + " px"} /></PB>
        <PB label={t("pitch")} hint={t("pitchHint")}><Sel value={pI} onChange={setPI} options={PITCH_OPTIONS} render={(p: number) => p + " µm"} /></PB>
        <PB label={t("display")} hint={t("displayHint")}><Sel value={dpI} onChange={setDpI} options={DISPLAY_PRESETS} render={(p: Preset) => p.label + " px"} /></PB>
        <PB label={t("focalFrom")} hint={t("focalFromHint")}><Nm value={fF} onChange={setFF} min={5} max={200} /></PB>
        <PB label={t("focalTo")} hint={t("focalToHint")}><Nm value={fT} onChange={setFT} min={5} max={200} /></PB>
      </div></Cd>

      <Cd title={t("computed")}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", fontSize: 12, fontFamily: mn }}>
        <div><div style={{ marginBottom: 4 }}><span style={{ color: C.H, fontWeight: 700 }}>{t("scaleH")}: {rH.toFixed(4)}</span><span style={{ color: C.dim }}> = {det.w}÷{disp.w}</span></div><div><span style={{ color: C.V, fontWeight: 700 }}>{t("scaleV")}: {rV.toFixed(4)}</span><span style={{ color: C.dim }}> = {det.h}÷{disp.h}</span></div></div>
        <div style={{ fontSize: 11, color: C.hint, lineHeight: 1.6 }}>{t("scaleExplain")}</div>
        <div><div style={{ marginBottom: 4 }}><span style={{ color: C.H, fontWeight: 700 }}>{t("effH")}: {eH.toFixed(2)} µm</span></div><div style={{ marginBottom: 8 }}><span style={{ color: C.V, fontWeight: 700 }}>{t("effV")}: {eV.toFixed(2)} µm</span></div>
          <div style={{ fontSize: 11 }}><span style={{ color: C.H }}>{t("multiplesH")} </span><span style={{ color: C.green }}>{mulH.length ? mulH.join(", ") + " мм" : t("multiplesNone")}</span></div>
          <div style={{ fontSize: 11 }}><span style={{ color: C.V }}>{t("multiplesV")} </span><span style={{ color: C.green }}>{mulV.length ? mulV.join(", ") + " мм" : t("multiplesNone")}</span></div></div>
        <div style={{ fontSize: 11, color: C.hint, lineHeight: 1.6 }}>{t("effExplain")}</div>
      </div><div style={{ marginTop: 12, fontSize: 12 }}>{aspOk ? <span style={{ color: C.green }}>✓ {t("aspectOk")}</span> : <span style={{ color: C.yellow }}>⚠ {t("aspectWarn")}</span>}</div></Cd>

      <SortModePanel mode={sm} setMode={setSm} t={t} />

      <Cd title={t("chartTitle")}><ResponsiveContainer width="100%" height={220}><BarChart data={chart} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="f" tick={{ fill: C.dim, fontSize: 10, fontFamily: mn }} interval={Math.max(0, Math.floor(chart.length / 20) - 1)} />
        <YAxis tick={{ fill: C.dim, fontSize: 10, fontFamily: mn }} domain={[0, "auto"]} /><Tooltip content={<CTip />} />
        <ReferenceLine y={1} stroke={C.green} strokeDasharray="4 4" strokeOpacity={0.5} /><ReferenceLine y={5} stroke={C.yellow} strokeDasharray="4 4" strokeOpacity={0.5} />
        <Bar dataKey="w" radius={[2, 2, 0, 0]} maxBarSize={16}>{chart.map((e, i) => <Cell key={i} fill={sc(e.w)} fillOpacity={top5.has(e.f) ? 1 : 0.4} />)}</Bar>
      </BarChart></ResponsiveContainer>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px", fontSize: 10, fontFamily: mn }}>
        <span><span style={{ color: C.green }}>■</span> {t("good")}</span><span><span style={{ color: C.yellow }}>■</span> {t("ok")}</span><span><span style={{ color: C.red }}>■</span> {t("bad")}</span>
      </div></Cd>

      <Explain sorted={sorted} mode={sm} t={t} />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={sS}>{t("tableTitle")}</span><span style={{ fontSize: 11, color: C.hint }}>{sm === "both" ? t("modeBoth") : sm === "vPriority" ? t("modeVPri") : t("modeVOnly")} · {sorted.length} {t("tableCount")} {lo}–{hi}mm</span>
        </div><div style={{ padding: "8px 16px", fontSize: 11, color: C.hint }}>{t("clickRowHint")}</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 12 }}>
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            <TH w={30} /><TH align="center" tip={t("tipF")}>{t("colF")}</TH>
            <TH align="right" color={C.H} tip={t("tipPpmH")}>{t("colPpmH")}</TH><TH align="right" color={C.H} tip={t("tipErrH")}>{t("colErrH")}</TH>
            <TH align="right" color={C.V} tip={t("tipPpmV")}>{t("colPpmV")}</TH><TH align="right" color={C.V} tip={t("tipErrV")}>{t("colErrV")}</TH>
            <TH align="right" tip={t("tipWorst")}>{t("colWorst")}</TH>
            <TH align="right" tip={t("tipMmH")}>{t("colMmH")}</TH><TH align="right" tip={t("tipMmV")}>{t("colMmV")}</TH>
          </tr></thead>
          <tbody>{sorted.map((r, i) => { const isT = top5.has(r.f); const sv = sm === "both" ? r.score : r.v.err; const isIdeal = r.h.err < 0.01 && r.v.err < 0.01; const cmpI = compared.indexOf(r.f); const isExp = expanded === r.f; const ch = { cursor: "help" as const }; return (<Fragment key={r.f}><tr onClick={() => setExpanded(prev => prev === r.f ? null : r.f)} style={{ borderBottom: `1px solid ${C.bg}`, background: isIdeal ? "#00ff8812" : isT ? sbg(sv) : "transparent", cursor: "pointer", borderLeft: isExp ? `3px solid ${C.green}` : cmpI >= 0 ? `3px solid ${CMP_COLORS[cmpI]}` : "3px solid transparent" }}>
            <td style={td("center", 30)}><span style={{ fontSize: 10, color: C.dim }}>{isExp ? "▾" : "▸"}</span>{isIdeal && <span style={{ fontSize: 16, color: "#00ff88", display: "inline-block", animation: "jackpot-pulse 2s ease-in-out infinite" }}>✦</span>}</td>
            <td title={cellTip("f", r, sv)} style={{ ...td("center"), ...ch, fontWeight: isT ? 700 : 400, color: isT ? "#fff" : C.text }}>{r.f}{i < 5 && <span style={{ fontSize: 9, color: C.green, marginLeft: 6, background: `${C.green}1a`, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>#{i + 1}</span>}{isIdeal && <span style={{ fontSize: 9, color: "#00ff88", marginLeft: 6, background: "#00ff8833", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>IDEAL</span>}</td>
            <td title={cellTip("ppmH", r, sv)} style={{ ...td("right"), ...ch, color: sm === "vOnly" ? C.hint : C.H }}>{r.h.ppm.toFixed(3)}</td>
            <td title={cellTip("errH", r, sv)} style={{ ...td("right"), ...ch, fontWeight: 600, color: sm === "vOnly" ? C.hint : sc(r.h.err) }}>{r.h.err.toFixed(2)}</td>
            <td title={cellTip("ppmV", r, sv)} style={{ ...td("right"), ...ch, color: C.V }}>{r.v.ppm.toFixed(3)}</td>
            <td title={cellTip("errV", r, sv)} style={{ ...td("right"), ...ch, fontWeight: 600, color: sc(r.v.err) }}>{r.v.err.toFixed(2)}</td>
            <td title={cellTip("worst", r, sv)} style={{ ...td("right"), ...ch, fontWeight: 700, color: sc(sv), fontSize: 13 }}>{sv.toFixed(2)}</td>
            <td title={cellTip("mmH", r, sv)} style={{ ...td("right"), ...ch, color: C.dim }}>{r.h.mm100.toFixed(2)}</td>
            <td title={cellTip("mmV", r, sv)} style={{ ...td("right"), ...ch, color: C.dim }}>{r.v.mm100.toFixed(2)}</td>
          </tr>{isExp && <tr><td colSpan={9} style={{ padding: 16, background: "#0a0a0a" }}>
            <div style={{ fontSize: 12, fontFamily: mn, color: C.dim, marginBottom: 12 }}>F = {r.f} mm — px/mrad <span style={{ color: C.H }}>H: {r.h.ppm.toFixed(3)}</span>, <span style={{ color: C.V }}>V: {r.v.ppm.toFixed(3)}</span> — err <span style={{ color: C.H }}>H: {r.h.err.toFixed(2)}%</span>, <span style={{ color: C.V }}>V: {r.v.err.toFixed(2)}%</span> — total: <span style={{ color: sc(sv) }}>{sv.toFixed(2)}%</span></div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ flex: "1 1 300px" }}>
                <div title={tip("tipPixelSize")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("pixelSize")}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                  <thead><tr><th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>{t("dist")}</th><th title={t("tipPixHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th><th title={t("tipPixVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th></tr></thead>
                  <tbody>{DISTANCES.map(d => { const hv = (r.h.mm100 * d / 100).toFixed(2), vv = (r.v.mm100 * d / 100).toFixed(2); return <tr key={d}><td title={cTip("dist", "", d)} style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td><td title={cTip("pixH", hv, d)} style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{hv}</td><td title={cTip("pixV", vv, d)} style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{vv}</td></tr>; })}</tbody>
                </table>
              </div>
              <div style={{ flex: "1 1 300px" }}>
                <div title={tip("tipPosError")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("posError")}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                  <thead><tr><th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>{t("dist")}</th><th title={t("tipErrHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th><th title={t("tipErrVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th></tr></thead>
                  <tbody>{DISTANCES.map(d => { const eh = r.h.err / 100 * d, ev = r.v.err / 100 * d; return <tr key={d}><td title={cTip("dist", "", d)} style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td><td title={cTip("errH", eh.toFixed(2), d)} style={{ textAlign: "right", color: eh < 5 ? C.green : eh < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{eh.toFixed(2)}</td><td title={cTip("errV", ev.toFixed(2), d)} style={{ textAlign: "right", color: ev < 5 ? C.green : ev < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{ev.toFixed(2)}</td></tr>; })}</tbody>
                </table>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setCompared(prev => prev.includes(r.f) ? prev.filter(x => x !== r.f) : prev.length < 9 ? [...prev, r.f] : prev); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px", fontSize: 11, color: C.dim, cursor: "pointer", fontFamily: mn, marginBottom: 12 }}>{compared.includes(r.f) ? t("removeCompare") : t("addCompare")}</button>
            <div style={{ fontSize: 10, color: C.hint }}>{t("expandHint")}</div>
          </td></tr>}</Fragment>); })}</tbody>
        </table></div>
      </div>

      {compared.length > 0 && <Cd title={t("compare")}><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {compared.map((f, ci) => { const r = results.find(x => x.f === f); if (!r) return null; const sv = sm === "both" ? r.score : r.v.err; return (
          <div key={f} style={{ flex: "1 1 280px", background: "#0e0e0e", padding: "12px 14px", borderRadius: "0 6px 6px 0", borderLeft: `3px solid ${CMP_COLORS[ci]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: mn }}><span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>F = {f} mm</span> <span style={{ fontSize: 11, color: "#b0b0b0" }}>{det.w}×{det.h} → {disp.w}×{disp.h} · {pitch}µm</span></span>
              <button onClick={() => setCompared(p => p.filter(x => x !== f))} style={{ background: "transparent", border: "none", color: C.hint, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, fontFamily: mn, color: C.dim, lineHeight: 1.8 }}>
              <div>px/mrad <span style={{ color: C.H }}>H: {r.h.ppm.toFixed(3)}</span>, <span style={{ color: C.V }}>V: {r.v.ppm.toFixed(3)}</span></div>
              <div>err <span style={{ color: sc(r.h.err) }}>H: {r.h.err.toFixed(2)}%</span>, <span style={{ color: sc(r.v.err) }}>V: {r.v.err.toFixed(2)}%</span></div>
              <div>total: <span style={{ color: sc(sv), fontWeight: 700 }}>{sv.toFixed(2)}%</span></div>
            </div>
            <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              <div title={tip("tipPixelSize")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("distTable")}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                <thead><tr>
                  <th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>D</th>
                  <th title={t("tipPixHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th>
                  <th title={t("tipPixVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th>
                </tr></thead>
                <tbody>{DISTANCES.map(d => { const hv = (r.h.mm100 * d / 100).toFixed(2), vv = (r.v.mm100 * d / 100).toFixed(2); return <tr key={d}>
                  <td title={cTip("dist", "", d)} style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td>
                  <td title={cTip("pixH", hv, d)} style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{hv}</td>
                  <td title={cTip("pixV", vv, d)} style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{vv}</td>
                </tr>; })}</tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              <div title={tip("tipPosError")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("posError")}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                <thead><tr>
                  <th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>D</th>
                  <th title={t("tipErrHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th>
                  <th title={t("tipErrVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th>
                </tr></thead>
                <tbody>{DISTANCES.map(d => { const eh = r.h.err / 100 * d, ev = r.v.err / 100 * d; return <tr key={d}>
                  <td title={cTip("dist", "", d)} style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td>
                  <td title={cTip("errH", eh.toFixed(2), d)} style={{ textAlign: "right", color: eh < 5 ? C.green : eh < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{eh.toFixed(2)}</td>
                  <td title={cTip("errV", ev.toFixed(2), d)} style={{ textAlign: "right", color: ev < 5 ? C.green : ev < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{ev.toFixed(2)}</td>
                </tr>; })}</tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, color: C.hint, marginTop: 8 }}>{t("expandHint")}</div>
          </div>); })}
      </div></Cd>}

      <Cd title={t("colDesc")}><div style={{ fontSize: 12, color: C.dim, lineHeight: 2 }}>
        <div><strong style={{ color: C.text }}>{t("colF")}</strong> — {t("descF")}</div>
        <div><strong style={{ color: C.H }}>{t("colPpmH")}</strong> — {t("descPpmH")}</div>
        <div><strong style={{ color: C.H }}>{t("colErrH")}</strong> — {t("descErrH")}</div>
        <div><strong style={{ color: C.V }}>{t("colPpmV")}</strong> — {t("descPpmV")}</div>
        <div><strong style={{ color: C.V }}>{t("colErrV")}</strong> — {t("descErrV")}</div>
        <div><strong style={{ color: C.text }}>{t("colWorst")}</strong> — {t("descWorst")}</div>
        <div><strong style={{ color: C.text }}>{t("colMmH")}/{t("colMmV")}</strong> — {t("descMm")}</div>
      </div></Cd>

      <Cd title={t("whyTitle")}><div style={{ fontSize: 13, color: C.dim, lineHeight: 1.7 }}>
        <p style={{ margin: "0 0 8px" }}>{t("why1")}</p><p style={{ margin: "0 0 8px" }}>{t("why2")}</p><p style={{ margin: 0 }}>{t("why3")}</p>
      </div></Cd>
      </>}

      {tab === "portfolio" && <>
      <p style={{ fontSize: 16, color: C.text, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 720, fontWeight: 500 }}>{t("portfolioSubtitle")}</p>

      <Cd title={t("focalRange")}><div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <PB label={t("focalFrom")} hint={t("focalFromHint")}><Nm value={pFF} onChange={setPFF} min={5} max={200} /></PB>
        <PB label={t("focalTo")} hint={t("focalToHint")}><Nm value={pFT} onChange={setPFT} min={5} max={200} /></PB>
      </div></Cd>

      <Cd title={t("configs")}>
        <div style={{ display: "flex", gap: 10, paddingLeft: 15, marginBottom: 6 }}>
          <div style={{ width: 120 }}><span style={{ fontSize: 10, color: C.hint, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("configName")}</span></div>
          <div style={{ width: 140 }} title={t("detectorHint")}><span style={{ fontSize: 10, color: C.hint, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "help" }}>{t("detector")}</span></div>
          <div style={{ width: 90 }} title={t("pitchHint")}><span style={{ fontSize: 10, color: C.hint, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "help" }}>{t("pitch")}</span></div>
          <div style={{ width: 140 }} title={t("displayHint")}><span style={{ fontSize: 10, color: C.hint, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "help" }}>{t("display")}</span></div>
        </div>
        {pCfg.map((cfg, ci) => (
          <div key={ci} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderLeft: `3px solid ${CMP_COLORS[ci]}`, paddingLeft: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <input type="text" placeholder={lang === "ru" ? `Конфиг ${ci+1}` : lang === "zh" ? `配置${ci+1}` : `Config ${ci+1}`}
              value={cfg.name} maxLength={20} onChange={e => setPCfg(prev => prev.map((c, i) => i === ci ? { ...c, name: e.target.value } : c))}
              style={{ ...iS, width: 120, padding: "6px 10px", fontSize: 12 }} />
            <Sel value={cfg.detI} onChange={v => setPCfg(prev => prev.map((c, i) => i === ci ? { ...c, detI: v } : c))} options={DETECTOR_PRESETS} render={(p: Preset) => p.label} />
            <Sel value={cfg.pitchI} onChange={v => setPCfg(prev => prev.map((c, i) => i === ci ? { ...c, pitchI: v } : c))} options={PITCH_OPTIONS} render={(p: number) => p + " µm"} />
            <Sel value={cfg.dispI} onChange={v => setPCfg(prev => prev.map((c, i) => i === ci ? { ...c, dispI: v } : c))} options={DISPLAY_PRESETS} render={(p: Preset) => p.label} />
            {pCfg.length > 2 && <button onClick={() => setPCfg(prev => prev.filter((_, i) => i !== ci))} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", color: C.dim, cursor: "pointer", fontSize: 14 }}>✕</button>}
          </div>
        ))}
        {pCfg.length < 6 && <button onClick={() => setPCfg(prev => [...prev, { name: "", detI: 3, pitchI: 0, dispI: 1 }])} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", color: C.dim, cursor: "pointer", fontFamily: mn, fontSize: 12, marginTop: 8 }}>{t("addConfig")}</button>}
      </Cd>

      {/* Portfolio sort mode - 2 buttons only */}
      <Cd title={t("sortModeTitle")}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {[{ k: "vOnly" as SortMode, l: t("modeVOnly"), d: t("modeVOnlyDesc"), tp: t("tipModeVOnly") }, { k: "vPriority" as SortMode, l: t("modeVPri"), d: t("modeVPriDesc"), tp: t("tipModeVPri") }].map(m => (
            <button key={m.k} onClick={() => setSm(m.k)} title={m.tp} style={{
              background: pMode === m.k ? C.V + "18" : "transparent",
              border: `1.5px solid ${pMode === m.k ? C.V : C.border}`,
              borderRadius: 6, padding: "8px 14px", cursor: "pointer", textAlign: "left" as const, flex: "1 1 180px"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: pMode === m.k ? C.V : C.dim, fontFamily: mn, marginBottom: 3 }}>{m.l}</div>
              <div style={{ fontSize: 10, color: pMode === m.k ? C.label : C.hint, lineHeight: 1.4 }}>{m.d}</div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.hint, lineHeight: 1.6, margin: 0 }}>{t("sortModeWhy")}</p>
      </Cd>

      {/* Results table — sorted by aggregate error */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={sS}>{t("pResultsTitle")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.hint }}>{pMode === "vPriority" ? t("modeVPri") : t("modeVOnly")} · {pSorted.length} {t("tableCount")} {pLo}–{pHi}mm</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.hint }}>{t("thresholdLabel")} <Nm value={pThr} onChange={setPThr} min={0.1} max={10} /> %</span>
          </div>
        </div>
        <div style={{ padding: "8px 16px", fontSize: 11, color: C.hint }}>{t("pResultsHint")}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 12 }}>
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <TH w={28} />
              <TH w={24} />
              <TH w={30} align="center">#</TH>
              <TH align="center" tip={t("tipF")}>{t("colF")}</TH>
              {pCfg.map((cfg, ci) => {
                const d = DETECTOR_PRESETS[cfg.detI], dp = DISPLAY_PRESETS[cfg.dispI], p = PITCH_OPTIONS[cfg.pitchI];
                const cfgLabel = cfg.name || `${d.label}→${dp.label}`;
                const sortKey = `c${ci + 1}`;
                const hdrTip = lang === "ru"
                  ? `Ошибка для конфигурации "${cfgLabel}" (сенсор ${d.w}×${d.h}, шаг ${p}µm → дисплей ${dp.w}×${dp.h}). Кликните для сортировки по этой конфигурации — лучшие объективы для этого прибора окажутся наверху.`
                  : lang === "zh"
                  ? `配置"${cfgLabel}"的误差（传感器${d.w}×${d.h}，间距${p}µm → 显示器${dp.w}×${dp.h}）。点击按此配置排序——该设备的最佳镜头将排在最前。`
                  : `Error for "${cfgLabel}" (sensor ${d.w}×${d.h}, pitch ${p}µm → display ${dp.w}×${dp.h}). Click to sort by this configuration — best lenses for this device will appear on top.`;
                return <TH key={ci} align="right" color={CMP_COLORS[ci]} tip={hdrTip} onClick={() => setPSort(sortKey)}>{cfgLabel} (%) {pSort === sortKey && "↑"}</TH>;
              })}
              <TH align="right" tip={lang === "ru" ? "Сколько конфигураций покрыты (ошибка ≤ порога). Кликните для сортировки по покрытию." : lang === "zh" ? "覆盖的配置数量（误差≤阈值）。点击按覆盖率排序。" : "How many configs covered (error ≤ threshold). Click to sort by coverage."} onClick={() => setPSort("cov")}>{t("colCoverage")} {pSort === "cov" && "↑"}</TH>
              <TH align="right" tip={t("tipAggCol")} onClick={() => setPSort("max")}>{t("pAggCol")} (%) {pSort === "max" && "↑"}</TH>
            </tr></thead>
            <tbody>{pSorted.map((row, i) => {
              const inPf = portfolio.includes(row.f);
              const isIdeal = row.aggregate < 0.01;
              const isTop5 = i < 5;
              const isExp = pExp === row.f;
              const modeLabel = pMode === "vPriority" ? t("modeVPri") : t("modeVOnly");
              let worstCi = 0;
              row.cfgs.forEach((c, ci) => { if (c.v.err > row.cfgs[worstCi].v.err) worstCi = ci; });
              const worstCfgLabel = pCfg[worstCi].name || `${DETECTOR_PRESETS[pCfg[worstCi].detI].label}→${DISPLAY_PRESETS[pCfg[worstCi].dispI].label}`;
              const fTip = lang === "ru"
                ? `Фокусное расстояние ${row.f} мм. Покрытие: ${row.coverage} из ${pCfg.length} конфигураций ≤ порога. Кликните чтобы ${inPf ? "убрать из" : "добавить в"} портфель.`
                : lang === "zh"
                ? `焦距${row.f}mm。覆盖率：${row.coverage}/${pCfg.length}配置≤阈值。点击${inPf ? "从组合中移除" : "添加到组合"}。`
                : `Focal length ${row.f} mm. Coverage: ${row.coverage} of ${pCfg.length} configurations ≤ threshold. Click to ${inPf ? "remove from" : "add to"} portfolio.`;
              const aggTip = lang === "ru"
                ? `Максимальная ошибка ${row.aggregate.toFixed(2)}% среди всех конфигураций (наихудший случай). Конфигурация с наибольшей ошибкой: "${worstCfgLabel}". Кликните для сортировки по worst case.`
                : lang === "zh"
                ? `所有配置中的最大误差${row.aggregate.toFixed(2)}%（最坏情况）。最大误差配置："${worstCfgLabel}"。点击按worst case排序。`
                : `Maximum error ${row.aggregate.toFixed(2)}% across all configurations (worst case). Configuration with highest error: "${worstCfgLabel}". Click to sort by worst case.`;
              const covTip = lang === "ru"
                ? `Этот объектив подходит (ошибка ≤ ${pThr}%) для ${row.coverage} из ${pCfg.length} конфигураций. Чем больше — тем выше переиспользуемость. Кликните для сортировки по покрытию.`
                : lang === "zh"
                ? `该镜头适用（误差≤${pThr}%）于${row.coverage}/${pCfg.length}配置。越多越好。点击按覆盖率排序。`
                : `This lens works (error ≤ ${pThr}%) for ${row.coverage} of ${pCfg.length} configurations. Higher = more reusable. Click to sort by coverage.`;
              return (<Fragment key={row.f}>
                <tr onClick={() => setPortfolio(prev => prev.includes(row.f) ? prev.filter(x => x !== row.f) : [...prev, row.f])}
                  style={{
                    borderBottom: `1px solid ${C.bg}`, cursor: "pointer",
                    background: isIdeal ? "#00ff8812" : inPf ? "#00ff8812" : isTop5 ? sbg(row.aggregate) : "transparent",
                    borderLeft: inPf ? `3px solid ${C.green}` : "3px solid transparent",
                  }}>
                  <td style={td("center", 28)}>
                    <span style={{ color: inPf ? C.green : C.hint, fontSize: 14 }}>{inPf ? "☑" : "☐"}</span>
                  </td>
                  <td style={td("center", 24)}>
                    <button onClick={(e) => { e.stopPropagation(); setPExp(prev => prev === row.f ? null : row.f); }} style={{ background: "transparent", border: "none", color: C.dim, cursor: "pointer", fontSize: 10, padding: "0 2px" }}>{isExp ? "▾" : "▸"}</button>
                  </td>
                  <td style={{ ...td("center", 30), fontSize: 10, color: C.dim }}>{i + 1}</td>
                  <td title={fTip} style={{ ...td("center"), cursor: "help", fontWeight: isTop5 ? 700 : 400, color: isTop5 ? "#fff" : C.text }}>
                    {isIdeal && <span style={{ fontSize: 16, color: "#00ff88", display: "inline-block", animation: "jackpot-pulse 2s ease-in-out infinite", marginRight: 4 }}>✦</span>}
                    {row.f}
                    {isTop5 && <span style={{ fontSize: 9, color: C.green, marginLeft: 6, background: `${C.green}1a`, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>#{i + 1}</span>}
                    {isIdeal && <span style={{ fontSize: 9, color: "#00ff88", marginLeft: 6, background: "#00ff8833", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>IDEAL</span>}
                  </td>
                  {row.cfgs.map((cfgR, ci) => {
                    const cfg = pCfg[ci];
                    const dPreset = DETECTOR_PRESETS[cfg.detI], dpPreset = DISPLAY_PRESETS[cfg.dispI], pVal = PITCH_OPTIONS[cfg.pitchI];
                    const cfgLabel = cfg.name || `${dPreset.label}→${dpPreset.label}`;
                    const sH = (dPreset.w / dpPreset.w).toFixed(4), sV = (dPreset.h / dpPreset.h).toFixed(4);
                    const belowThr = cfgR.score <= pThr;
                    const cfgTip = lang === "ru"
                      ? `Ошибка ${cfgR.score.toFixed(2)}% для конфигурации "${cfgLabel}" (сенсор ${dPreset.w}×${dPreset.h}, шаг ${pVal}µm, дисплей ${dpPreset.w}×${dpPreset.h}). Масштаб H: ${sH}, V: ${sV}. px/мрад H: ${cfgR.h.ppm.toFixed(3)} (ош. ${cfgR.h.err.toFixed(2)}%), V: ${cfgR.v.ppm.toFixed(3)} (ош. ${cfgR.v.err.toFixed(2)}%). Режим ${modeLabel}: итог ${cfgR.score.toFixed(2)}%. ${belowThr ? `● Ниже порога ${pThr}% — объектив подходит для этой конфигурации.` : `Выше порога ${pThr}%.`}`
                      : lang === "zh"
                      ? `"${cfgLabel}"误差${cfgR.score.toFixed(2)}% (传感器${dPreset.w}×${dPreset.h}, 间距${pVal}µm, 显示器${dpPreset.w}×${dpPreset.h})。缩放H: ${sH}, V: ${sV}。px/mrad H: ${cfgR.h.ppm.toFixed(3)} (误差${cfgR.h.err.toFixed(2)}%), V: ${cfgR.v.ppm.toFixed(3)} (误差${cfgR.v.err.toFixed(2)}%)。模式${modeLabel}: 综合${cfgR.score.toFixed(2)}%。${belowThr ? `● 低于阈值${pThr}%——镜头适合此配置。` : `高于阈值${pThr}%。`}`
                      : `Error ${cfgR.score.toFixed(2)}% for "${cfgLabel}" (sensor ${dPreset.w}×${dPreset.h}, pitch ${pVal}µm, display ${dpPreset.w}×${dpPreset.h}). Scale H: ${sH}, V: ${sV}. px/mrad H: ${cfgR.h.ppm.toFixed(3)} (err ${cfgR.h.err.toFixed(2)}%), V: ${cfgR.v.ppm.toFixed(3)} (err ${cfgR.v.err.toFixed(2)}%). Mode ${modeLabel}: overall ${cfgR.score.toFixed(2)}%. ${belowThr ? `● Below threshold ${pThr}% — lens works for this configuration.` : `Above threshold ${pThr}%.`}`;
                    return <td key={ci} title={cfgTip} style={{ ...td("right"), cursor: "help", fontWeight: 600, color: sc(cfgR.score) }}>{cfgR.score.toFixed(2)}{belowThr && <span style={{ fontSize: 8, color: C.green, marginLeft: 4 }}>●</span>}</td>;
                  })}
                  <td title={covTip} onClick={(e) => { e.stopPropagation(); setPSort("cov"); }} style={{ ...td("center"), cursor: "pointer", fontWeight: 600, color: row.coverage === pCfg.length ? C.green : row.coverage > 0 ? C.yellow : C.hint }}>{row.coverage}/{pCfg.length}</td>
                  <td title={aggTip} onClick={(e) => { e.stopPropagation(); setPSort("max"); }} style={{ ...td("right"), cursor: "pointer", fontWeight: 700, color: sc(row.aggregate), fontSize: 13 }}>{row.aggregate.toFixed(2)}</td>
                </tr>
                {isExp && <tr><td colSpan={4 + pCfg.length + 2} style={{ padding: 16, background: "#0a0a0a" }}>
                  {row.cfgs.map((cfgR, ci) => {
                    const cfg = pCfg[ci];
                    const cfgLabel = cfg.name || `${DETECTOR_PRESETS[cfg.detI].label}→${DISPLAY_PRESETS[cfg.dispI].label}`;
                    const dPreset = DETECTOR_PRESETS[cfg.detI], dpPreset = DISPLAY_PRESETS[cfg.dispI], pVal = PITCH_OPTIONS[cfg.pitchI];
                    const sH = (dPreset.w / dpPreset.w).toFixed(4), sV = (dPreset.h / dpPreset.h).toFixed(4);
                    const effH = (dPreset.w / dpPreset.w * pVal).toFixed(2), effV = (dPreset.h / dpPreset.h * pVal).toFixed(2);
                    return (<div key={ci} style={{ borderLeft: `3px solid ${CMP_COLORS[ci]}`, paddingLeft: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontFamily: mn, color: CMP_COLORS[ci], fontWeight: 700, marginBottom: 6 }}>{cfgLabel} <span style={{ color: C.dim, fontWeight: 400 }}>({dPreset.label} → {dpPreset.label}, {pVal}µm)</span></div>
                      <div style={{ fontSize: 11, fontFamily: mn, color: C.dim, marginBottom: 4 }}>
                        {lang === "ru" ? "Масштаб" : lang === "zh" ? "缩放" : "Scale"} H: {sH}, V: {sV} · {lang === "ru" ? "Эфф. шаг" : lang === "zh" ? "有效间距" : "Eff. pitch"} H: {effH}µm, V: {effV}µm
                      </div>
                      <div style={{ fontSize: 12, fontFamily: mn, color: C.dim, marginBottom: 8 }}>
                        px/mrad <span style={{ color: C.H }}>H: {cfgR.h.ppm.toFixed(3)}</span>, <span style={{ color: C.V }}>V: {cfgR.v.ppm.toFixed(3)}</span> — err <span style={{ color: sc(cfgR.h.err) }}>H: {cfgR.h.err.toFixed(2)}%</span>, <span style={{ color: sc(cfgR.v.err) }}>V: {cfgR.v.err.toFixed(2)}%</span> — total: <span style={{ color: sc(cfgR.score) }}>{cfgR.score.toFixed(2)}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 300px" }}>
                          <div title={tip("tipPixelSize")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("pixelSize")}</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                            <thead><tr><th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>{t("dist")}</th><th title={t("tipPixHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th><th title={t("tipPixVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th></tr></thead>
                            <tbody>{DISTANCES.map(d => { const hv = (cfgR.h.mm100 * d / 100).toFixed(2), vv = (cfgR.v.mm100 * d / 100).toFixed(2); return <tr key={d}><td title={cTip("dist", "", d)} style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td><td title={cTip("pixH", hv, d)} style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{hv}</td><td title={cTip("pixV", vv, d)} style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{vv}</td></tr>; })}</tbody>
                          </table>
                        </div>
                        <div style={{ flex: "1 1 300px" }}>
                          <div title={tip("tipPosError")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("posError")}</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                            <thead><tr><th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>{t("dist")}</th><th title={t("tipErrHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th><th title={t("tipErrVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th></tr></thead>
                            <tbody>{DISTANCES.map(d => { const eh = cfgR.h.err / 100 * d, ev = cfgR.v.err / 100 * d; return <tr key={d}><td title={cTip("dist", "", d)} style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td><td title={cTip("errH", eh.toFixed(2), d)} style={{ textAlign: "right", color: eh < 5 ? C.green : eh < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{eh.toFixed(2)}</td><td title={cTip("errV", ev.toFixed(2), d)} style={{ textAlign: "right", color: ev < 5 ? C.green : ev < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{ev.toFixed(2)}</td></tr>; })}</tbody>
                          </table>
                        </div>
                      </div>
                    </div>);
                  })}
                </td></tr>}
              </Fragment>);
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Portfolio matrix */}
      {portfolio.length > 0 ? (
        <div style={{ background: "#0c1a14", border: `1px solid #1a3a28`, borderRadius: 8, padding: "14px 20px", marginBottom: 20 }}>
          <div style={sS}>{t("portfolioTitle")}</div>
          <div style={{ fontSize: 11, color: C.hint, marginBottom: 10 }}>{t("pPortfolioDesc")}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 12 }}>
              <thead><tr>
                <TH></TH>
                {[...portfolio].sort((a,b) => a-b).map(f => {
                  const fhTip = lang === "ru" ? `F=${f} мм в портфеле. Нажмите ✕ чтобы убрать.`
                    : lang === "zh" ? `F=${f}mm在组合中。点击✕移除。`
                    : `F=${f} mm in portfolio. Click ✕ to remove.`;
                  return (
                    <TH key={f} align="center" tip={fhTip}>
                      F={f} <button onClick={() => setPortfolio(prev => prev.filter(x => x !== f))} style={{ background: "transparent", border: "none", color: C.hint, cursor: "pointer", fontSize: 10 }}>✕</button>
                    </TH>
                  );
                })}
                <TH align="center" color={C.green}>{t("bestLens")}</TH>
              </tr></thead>
              <tbody>
                {pCfg.map((cfg, ci) => {
                  const cfgLabel = cfg.name || `${DETECTOR_PRESETS[cfg.detI].label}→${DISPLAY_PRESETS[cfg.dispI].label}`;
                  const sortedPf = [...portfolio].sort((a,b) => a-b);
                  const pfErrors = sortedPf.map(f => {
                    const row = pResults.find(r => r.f === f);
                    return row ? row.cfgs[ci] : null;
                  });
                  let bestF = sortedPf[0], bestErr = Infinity;
                  pfErrors.forEach((e, i) => {
                    if (e && e.score < bestErr) { bestErr = e.score; bestF = sortedPf[i]; }
                  });
                  const dPreset = DETECTOR_PRESETS[cfg.detI], dpPreset = DISPLAY_PRESETS[cfg.dispI], pVal = PITCH_OPTIONS[cfg.pitchI];
                  const bestTip = lang === "ru"
                    ? `Лучший объектив из портфеля для этой конфигурации — F=${bestF} мм с ошибкой ${bestErr.toFixed(2)}%. Из ${sortedPf.length} объективов в портфеле.`
                    : lang === "zh"
                    ? `该配置的最佳组合镜头——F=${bestF}mm，误差${bestErr.toFixed(2)}%。组合中共${sortedPf.length}个镜头。`
                    : `Best portfolio lens for this configuration — F=${bestF} mm with ${bestErr.toFixed(2)}% error. From ${sortedPf.length} lenses in portfolio.`;
                  return (
                    <tr key={ci} style={{ borderBottom: `1px solid #1a3a28`, borderLeft: `3px solid ${CMP_COLORS[ci]}` }}>
                      <td style={{ ...td("left"), color: CMP_COLORS[ci], fontWeight: 700 }}>{cfgLabel}</td>
                      {pfErrors.map((e, i) => {
                        const isBest = sortedPf[i] === bestF;
                        const isZero = e && e.score < 0.01;
                        const matTip = e ? (lang === "ru"
                          ? `При F=${sortedPf[i]} мм конфигурация "${cfgLabel}" (сенсор ${dPreset.w}×${dPreset.h} → дисплей ${dpPreset.w}×${dpPreset.h}, pitch ${pVal}µm) даёт ошибку ${e.score.toFixed(2)}%. px/мрад H: ${e.h.ppm.toFixed(3)} (${e.h.err.toFixed(2)}%), V: ${e.v.ppm.toFixed(3)} (${e.v.err.toFixed(2)}%).`
                          : lang === "zh"
                          ? `F=${sortedPf[i]}mm时配置"${cfgLabel}" (传感器${dPreset.w}×${dPreset.h} → 显示器${dpPreset.w}×${dpPreset.h}, 间距${pVal}µm) 误差${e.score.toFixed(2)}%。px/mrad H: ${e.h.ppm.toFixed(3)} (${e.h.err.toFixed(2)}%), V: ${e.v.ppm.toFixed(3)} (${e.v.err.toFixed(2)}%)。`
                          : `At F=${sortedPf[i]} mm "${cfgLabel}" (sensor ${dPreset.w}×${dPreset.h} → display ${dpPreset.w}×${dpPreset.h}, pitch ${pVal}µm) gives ${e.score.toFixed(2)}% error. px/mrad H: ${e.h.ppm.toFixed(3)} (${e.h.err.toFixed(2)}%), V: ${e.v.ppm.toFixed(3)} (${e.v.err.toFixed(2)}%).`) : "";
                        return (
                          <td key={i} title={matTip} style={{
                            ...td("center"), fontWeight: isBest ? 700 : 400,
                            color: e ? sc(e.score) : C.hint,
                            border: isBest ? `1px solid ${C.green}` : "none",
                            cursor: "help",
                          }}>
                            {e ? e.score.toFixed(2) : "—"}
                            {isZero && <span style={{ color: C.green }}> ✦</span>}
                            {e && e.score <= pThr && <span style={{ fontSize: 8, color: C.green, marginLeft: 4 }}>●</span>}
                          </td>
                        );
                      })}
                      <td title={bestTip} style={{ ...td("center"), fontWeight: 700, color: C.green, cursor: "help" }}>
                        {bestF} {lang === "ru" ? "мм" : "mm"} ({bestErr.toFixed(2)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Coverage indicator */}
          <div title={t("pTipCoverage")} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", cursor: "help" }}>
            <span style={{ fontSize: 12, color: C.label, fontFamily: mn }}>{t("coverageLabel")}:</span>
            {(() => {
              const sortedPf = [...portfolio].sort((a,b) => a-b);
              const covered = pCfg.map((_, ci) => sortedPf.some(f => {
                const row = pResults.find(r => r.f === f);
                return row && row.cfgs[ci].score <= pThr;
              }));
              const covCount = covered.filter(Boolean).length;
              const uncoveredNames = pCfg.map((cfg, ci) => !covered[ci] ? (cfg.name || `${DETECTOR_PRESETS[cfg.detI].label}→${DISPLAY_PRESETS[cfg.dispI].label}`) : null).filter(Boolean);
              return (<>
                <span style={{ fontSize: 13, fontWeight: 700, color: covCount === pCfg.length ? C.green : C.yellow, fontFamily: mn }}>
                  {covCount === pCfg.length ? t("fullCoverage") : `${covCount} ${t("outOf")} ${pCfg.length}`}
                </span>
                {uncoveredNames.length > 0 && <span style={{ fontSize: 12, color: C.yellow }}>{t("notCovered")} {uncoveredNames.join(", ")}</span>}
              </>);
            })()}
          </div>
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px", marginBottom: 20, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: C.hint }}>{t("portfolioEmpty")}</span>
        </div>
      )}
      </>}

    </div>
  </div>);
}
