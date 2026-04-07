import { useState, useMemo, useEffect, Fragment } from "react";
import { T, LANG_KEY } from "./i18n";
import type { Preset, PConfig, PCfgResult } from "./optics";
import { calcAxis } from "./optics";
import { DETECTOR_PRESETS, DISPLAY_PRESETS, PITCH_OPTIONS, CMP_COLORS, DISTANCES, parseHash, C, sc, sbg, mn, sS, iS, td } from "./theme";
import { PB, Sel, Nm, Cd, TH, RikaLogo, LangSw } from "./ui";

const _hp = parseHash();

export default function App() {
  const [lang, setLang] = useState(() => { if (_hp.lang && T[_hp.lang]) return _hp.lang; try { return localStorage.getItem(LANG_KEY) || "en"; } catch { return "en"; } });
  const t = (k: string) => T[lang]?.[k] ?? T.en[k] ?? k;
  const tip = t;
  const cl = (l: string) => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore quota/privacy errors */ } };
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Portfolio state
  const [pCfg, setPCfg] = useState<PConfig[]>(() => {
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
  const [pFF, setPFF] = useState(() => { const v = Number(_hp.from); return v >= 5 && v <= 200 ? v : 20; });
  const [pFT, setPFT] = useState(() => { const v = Number(_hp.to); return v >= 5 && v <= 200 ? v : 75; });
  const [portfolio, setPortfolio] = useState<number[]>(() => {
    if (!_hp.pf) return [];
    return _hp.pf.split(",").map(Number).filter(n => n >= 5 && n <= 200);
  });
  const [pThr, setPThr] = useState(() => { const v = Number(_hp.thr); return v >= 0.1 && v <= 10 ? v : 1; });
  const [pExp, setPExp] = useState<number | null>(null);
  const [pSort, setPSort] = useState<string>(() => {
    const s = _hp.sort;
    if (s === "max" || s === "cov") return s;
    if (s && /^c\d+$/.test(s)) return s;
    return "max";
  });

  useEffect(() => {
    const cs = pCfg.map((c, i) => `c${i+1}=${c.detI},${c.pitchI},${c.dispI}`).join("&");
    const ns = pCfg.map((c, i) => c.name ? `n${i+1}=${encodeURIComponent(c.name)}` : "").filter(Boolean).join("&");
    const pf = portfolio.length ? `&pf=${portfolio.join(",")}` : "";
    window.location.hash = `from=${pFF}&to=${pFT}&thr=${pThr}&sort=${pSort}&lang=${lang}&${cs}${ns ? "&" + ns : ""}${pf}`;
  }, [pFF, pFT, pThr, pSort, lang, pCfg, portfolio]);

  const copyLink = () => { navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

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
  const pByF = useMemo(() => new Map(pResults.map(r => [r.f, r])), [pResults]);

  const pSorted = useMemo(() => {
    const rows = pResults.map(row => {
      const aggregate = Math.max(...row.cfgs.map(c => c.v.err));
      const coverage = row.cfgs.filter(c => c.score <= pThr).length;
      return { ...row, aggregate, coverage };
    });
    return rows.sort((a, b) => {
      if (pSort === "cov") {
        const d = b.coverage - a.coverage;
        if (d !== 0) return d;
        return a.aggregate - b.aggregate;
      }
      if (pSort.startsWith("c") && pSort !== "cov") {
        const ci = parseInt(pSort.slice(1)) - 1;
        if (ci >= 0 && ci < a.cfgs.length) return a.cfgs[ci].v.err - b.cfgs[ci].v.err;
      }
      return a.aggregate - b.aggregate;
    });
  }, [pResults, pSort, pThr]);

  return (<div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI',system-ui,sans-serif", padding: "0 16px 40px" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 0 20px", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        <RikaLogo /><h1 style={{ flex: 1, fontSize: 18, fontWeight: 700, margin: 0, color: "#fff", fontFamily: mn }}>{t("title")} <span style={{ fontSize: 11, fontWeight: 400, color: C.hint }}>v7.3.0</span></h1><button onClick={copyLink} style={{ background: copied ? "#00ff8818" : "#ffffff08", border: `1px solid ${copied ? C.green : C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, color: copied ? C.green : C.dim, cursor: "pointer", fontFamily: mn, whiteSpace: "nowrap" }}>{copied ? t("linkCopied") : t("copyLink")}</button><LangSw lang={lang} setLang={cl} />
      </div>

      <p style={{ fontSize: 16, color: C.text, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 720, fontWeight: 500 }}>{t("subtitle")}</p>

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

      {/* Vertical-only notice */}
      <div style={{ background: C.V + "10", border: `1px solid ${C.V}44`, borderRadius: 8, padding: "12px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.V, fontFamily: mn, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("verticalOnlyTitle")}</div>
        <p style={{ fontSize: 12, color: C.label, lineHeight: 1.6, margin: 0 }}>{t("verticalOnlyNote")}</p>
      </div>

      {/* Results table — sorted by aggregate error */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={sS}>{t("pResultsTitle")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.hint }}>{pSorted.length} {t("tableCount")} {pLo}–{pHi}mm</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.hint }}>{t("thresholdLabel")} <Nm value={pThr} onChange={setPThr} min={0.1} max={10} /> %</span>
          </div>
        </div>
        <div style={{ padding: "8px 16px", fontSize: 11, color: C.hint }}>{t("pResultsHint")}</div>
        {isMobile && (
          <div style={{ padding: "0 16px 8px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.hint, fontFamily: mn }}>
            <span>{t("sortBy")}:</span>
            <select value={pSort} onChange={e => setPSort(e.target.value)} style={{ ...iS, padding: "6px 10px", fontSize: 12 }}>
              <option value="max">{t("pAggCol")}</option>
              <option value="cov">{t("colCoverage")}</option>
              {pCfg.map((cfg, ci) => {
                const d = DETECTOR_PRESETS[cfg.detI], dp = DISPLAY_PRESETS[cfg.dispI];
                const label = cfg.name || `${d.label}→${dp.label}`;
                return <option key={ci} value={`c${ci + 1}`}>{label}</option>;
              })}
            </select>
          </div>
        )}
        {isMobile ? (
          <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {pSorted.map((row, i) => {
              const inPf = portfolio.includes(row.f);
              const isIdeal = row.aggregate < 0.01;
              const isTop5 = i < 5;
              const isExp = pExp === row.f;
              return (<div key={row.f}
                onClick={() => setPortfolio(prev => prev.includes(row.f) ? prev.filter(x => x !== row.f) : [...prev, row.f])}
                style={{
                  background: isIdeal ? "#00ff8812" : inPf ? "#00ff8812" : isTop5 ? sbg(row.aggregate) : "#0a0a0a",
                  border: `1px solid ${inPf ? C.green : C.border}`,
                  borderLeft: `3px solid ${inPf ? C.green : isIdeal ? C.green : isTop5 ? sc(row.aggregate) : C.border}`,
                  borderRadius: 6, padding: "10px 12px", cursor: "pointer",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: inPf ? C.green : C.hint, fontSize: 16 }}>{inPf ? "☑" : "☐"}</span>
                  <span style={{ fontSize: 11, color: C.dim, fontFamily: mn, minWidth: 24 }}>#{i + 1}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: isTop5 ? "#fff" : C.text, fontFamily: mn }}>F={row.f}</span>
                  {isIdeal && <span style={{ fontSize: 14, color: "#00ff88", animation: "jackpot-pulse 2s ease-in-out infinite" }}>✦</span>}
                  {isTop5 && <span style={{ fontSize: 9, color: C.green, background: `${C.green}1a`, padding: "1px 5px", borderRadius: 3, fontWeight: 700, fontFamily: mn }}>#{i + 1}</span>}
                  {isIdeal && <span style={{ fontSize: 9, color: "#00ff88", background: "#00ff8833", padding: "1px 5px", borderRadius: 3, fontWeight: 700, fontFamily: mn }}>IDEAL</span>}
                  <span style={{ flex: 1 }} />
                  <button onClick={(e) => { e.stopPropagation(); setPExp(prev => prev === row.f ? null : row.f); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.dim, cursor: "pointer", fontSize: 11, padding: "3px 8px", fontFamily: mn }}>{isExp ? "▾" : "▸"}</button>
                </div>
                <div style={{ fontFamily: mn, fontSize: 12, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                  {row.cfgs.map((cfgR, ci) => {
                    const cfg = pCfg[ci];
                    const cfgLabel = cfg.name || `${DETECTOR_PRESETS[cfg.detI].label}→${DISPLAY_PRESETS[cfg.dispI].label}`;
                    const belowThr = cfgR.score <= pThr;
                    return (<div key={ci} style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, borderLeft: `2px solid ${CMP_COLORS[ci]}` }}>
                      <span style={{ color: CMP_COLORS[ci], flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfgLabel}</span>
                      <span style={{ color: sc(cfgR.score), fontWeight: 600, minWidth: 46, textAlign: "right" }}>{cfgR.score.toFixed(2)}%</span>
                      {belowThr && <span style={{ fontSize: 9, color: C.green }}>●</span>}
                    </div>);
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontFamily: mn, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                  <span style={{ color: C.hint }}>{t("colCoverage")}: <span style={{ color: row.coverage === pCfg.length ? C.green : row.coverage > 0 ? C.yellow : C.hint, fontWeight: 700 }}>{row.coverage}/{pCfg.length}</span></span>
                  <span style={{ color: C.hint }}>{t("pAggCol")}: <span style={{ color: sc(row.aggregate), fontWeight: 700 }}>{row.aggregate.toFixed(2)}%</span></span>
                </div>
                {isExp && (
                  <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, cursor: "default" }}>
                    {row.cfgs.map((cfgR, ci) => {
                      const cfg = pCfg[ci];
                      const cfgLabel = cfg.name || `${DETECTOR_PRESETS[cfg.detI].label}→${DISPLAY_PRESETS[cfg.dispI].label}`;
                      const dPreset = DETECTOR_PRESETS[cfg.detI], dpPreset = DISPLAY_PRESETS[cfg.dispI], pVal = PITCH_OPTIONS[cfg.pitchI];
                      return (<div key={ci} style={{ borderLeft: `3px solid ${CMP_COLORS[ci]}`, paddingLeft: 10, marginBottom: 12, fontFamily: mn, fontSize: 10 }}>
                        <div style={{ color: CMP_COLORS[ci], fontWeight: 700, marginBottom: 4 }}>{cfgLabel} <span style={{ color: C.dim, fontWeight: 400 }}>({dPreset.label}→{dpPreset.label}, {pVal}µm)</span></div>
                        <div style={{ color: C.dim, marginBottom: 6 }}>
                          px/mrad H: <span style={{ color: C.H }}>{cfgR.h.ppm.toFixed(3)}</span>, V: <span style={{ color: C.V }}>{cfgR.v.ppm.toFixed(3)}</span> · err V: <span style={{ color: sc(cfgR.v.err) }}>{cfgR.v.err.toFixed(2)}%</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div title={tip("tipPixelSize")} style={{ color: C.label, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 9 }}>{t("pixelSize")}</div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", color: C.dim }}>
                            {DISTANCES.map(d => <span key={d}>{d}m: {(cfgR.v.mm100 * d / 100).toFixed(1)}mm</span>)}
                          </div>
                          <div title={tip("tipPosError")} style={{ color: C.label, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 9, marginTop: 4 }}>{t("posError")}</div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {DISTANCES.map(d => { const ev = cfgR.v.err / 100 * d; return <span key={d} style={{ color: ev < 5 ? C.green : ev < 20 ? C.yellow : C.red }}>{d}m: {ev.toFixed(1)}mm</span>; })}
                          </div>
                        </div>
                      </div>);
                    })}
                  </div>
                )}
              </div>);
            })}
          </div>
        ) : (
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
                      ? `Ошибка ${cfgR.score.toFixed(2)}% (только по вертикали) для конфигурации "${cfgLabel}" (сенсор ${dPreset.w}×${dPreset.h}, шаг ${pVal}µm, дисплей ${dpPreset.w}×${dpPreset.h}). Масштаб H: ${sH}, V: ${sV}. px/мрад H: ${cfgR.h.ppm.toFixed(3)} (ош. ${cfgR.h.err.toFixed(2)}%), V: ${cfgR.v.ppm.toFixed(3)} (ош. ${cfgR.v.err.toFixed(2)}%). ${belowThr ? `● Ниже порога ${pThr}% — объектив подходит для этой конфигурации.` : `Выше порога ${pThr}%.`}`
                      : lang === "zh"
                      ? `"${cfgLabel}"误差${cfgR.score.toFixed(2)}%（仅垂直）(传感器${dPreset.w}×${dPreset.h}, 间距${pVal}µm, 显示器${dpPreset.w}×${dpPreset.h})。缩放H: ${sH}, V: ${sV}。px/mrad H: ${cfgR.h.ppm.toFixed(3)} (误差${cfgR.h.err.toFixed(2)}%), V: ${cfgR.v.ppm.toFixed(3)} (误差${cfgR.v.err.toFixed(2)}%)。${belowThr ? `● 低于阈值${pThr}%——镜头适合此配置。` : `高于阈值${pThr}%。`}`
                      : `Error ${cfgR.score.toFixed(2)}% (vertical only) for "${cfgLabel}" (sensor ${dPreset.w}×${dPreset.h}, pitch ${pVal}µm, display ${dpPreset.w}×${dpPreset.h}). Scale H: ${sH}, V: ${sV}. px/mrad H: ${cfgR.h.ppm.toFixed(3)} (err ${cfgR.h.err.toFixed(2)}%), V: ${cfgR.v.ppm.toFixed(3)} (err ${cfgR.v.err.toFixed(2)}%). ${belowThr ? `● Below threshold ${pThr}% — lens works for this configuration.` : `Above threshold ${pThr}%.`}`;
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
                            <tbody>{DISTANCES.map(d => { const hv = (cfgR.h.mm100 * d / 100).toFixed(2), vv = (cfgR.v.mm100 * d / 100).toFixed(2); return <tr key={d}><td style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td><td style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{hv}</td><td style={{ textAlign: "right", color: C.dim, padding: "2px 4px" }}>{vv}</td></tr>; })}</tbody>
                          </table>
                        </div>
                        <div style={{ flex: "1 1 300px" }}>
                          <div title={tip("tipPosError")} style={{ fontSize: 10, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, cursor: "help" }}>{t("posError")}</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mn, fontSize: 11 }}>
                            <thead><tr><th title={t("tipDistCol")} style={{ textAlign: "left", color: C.label, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>{t("dist")}</th><th title={t("tipErrHCol")} style={{ textAlign: "right", color: C.H, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>H, mm</th><th title={t("tipErrVCol")} style={{ textAlign: "right", color: C.V, fontWeight: 600, padding: "2px 4px", fontSize: 10, cursor: "help" }}>V, mm</th></tr></thead>
                            <tbody>{DISTANCES.map(d => { const eh = cfgR.h.err / 100 * d, ev = cfgR.v.err / 100 * d; return <tr key={d}><td style={{ color: C.dim, padding: "2px 4px" }}>{d}m</td><td style={{ textAlign: "right", color: eh < 5 ? C.green : eh < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{eh.toFixed(2)}</td><td style={{ textAlign: "right", color: ev < 5 ? C.green : ev < 20 ? C.yellow : C.red, padding: "2px 4px" }}>{ev.toFixed(2)}</td></tr>; })}</tbody>
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
        )}
      </div>

      {/* Coverage summary */}
      {portfolio.length > 0 ? (() => {
        const sortedPf = [...portfolio].sort((a, b) => a - b);
        const covered = pCfg.map((_, ci) => sortedPf.some(f => {
          const row = pByF.get(f);
          return row && row.cfgs[ci].score <= pThr;
        }));
        const covCount = covered.filter(Boolean).length;
        const uncoveredNames = pCfg.map((cfg, ci) => !covered[ci] ? (cfg.name || `${DETECTOR_PRESETS[cfg.detI].label}→${DISPLAY_PRESETS[cfg.dispI].label}`) : null).filter(Boolean) as string[];
        const isFull = covCount === pCfg.length;
        return (
          <div style={{ background: isFull ? "#0c1a14" : C.card, border: `1px solid ${isFull ? "#1a3a28" : C.border}`, borderRadius: 8, padding: "14px 20px", marginBottom: 20 }}>
            <div title={t("pTipCoverage")} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", cursor: "help", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("coverageLabel")}:</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: isFull ? C.green : C.yellow, fontFamily: mn }}>
                {isFull ? t("fullCoverage") : `${covCount} ${t("outOf")} ${pCfg.length}`}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.hint, fontFamily: mn, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>{lang === "ru" ? "В портфеле:" : lang === "zh" ? "组合中：" : "In portfolio:"}</span>
              {sortedPf.map(f => (
                <span key={f} style={{ background: "#00ff8812", border: `1px solid ${C.green}44`, borderRadius: 4, padding: "2px 8px", color: C.green, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  F={f}
                  <button onClick={() => setPortfolio(prev => prev.filter(x => x !== f))} style={{ background: "transparent", border: "none", color: C.hint, cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1 }}>✕</button>
                </span>
              ))}
            </div>
            {uncoveredNames.length > 0 && (
              <div style={{ fontSize: 12, color: C.yellow, marginTop: 8 }}>{t("notCovered")} {uncoveredNames.join(", ")}</div>
            )}
          </div>
        );
      })() : (
        <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
          <span style={{ fontSize: 12, color: C.hint }}>{t("portfolioEmpty")}</span>
        </div>
      )}

    </div>
  </div>);
}
