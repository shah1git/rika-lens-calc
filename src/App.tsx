import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// ── i18n ──────────────────────────────────────────────────────────────

const T: Record<string, Record<string, string>> = {
  ru: {
    title: "Подбор объектива",
    subtitle: "Поиск фокусного расстояния, при котором 1 мрад точно укладывается в целое число пикселей микродисплея по обеим осям",
    params: "Параметры оптической системы",
    detector: "Сенсор (детектор)",
    detectorHint: "Разрешение ИК-матрицы, пикс. Количество светочувствительных элементов по ширине × высоте. Определяет, сколько точек «видит» объектив.",
    pitch: "Шаг пикселя сенсора",
    pitchHint: "Физический размер одного пикселя ИК-матрицы в микрометрах. 12 мкм — современные, 17 мкм — стандартные, 25 мкм — устаревшие матрицы.",
    display: "Микродисплей (окуляр)",
    displayHint: "Разрешение OLED/LCD экрана в окуляре, на который выводится изображение с сенсора. Сетка рисуется на этих пикселях.",
    focalFrom: "Фокус от, мм",
    focalFromHint: "Начало диапазона поиска объектива.",
    focalTo: "Фокус до, мм",
    focalToHint: "Конец диапазона. Проверяется каждый мм.",
    computed: "Как работает оптическая система",
    scaleH: "Масштаб по горизонтали",
    scaleV: "Масштаб по вертикали",
    scaleExplain: "Отношение разрешения сенсора к разрешению дисплея. Показывает, сколько пикселей сенсора приходится на один пиксель дисплея. Если < 1 — изображение растягивается (дисплей крупнее сенсора). Безразмерная величина.",
    effH: "Эфф. шаг дисплея H",
    effV: "Эфф. шаг дисплея V",
    effExplain: "Масштаб × шаг пикселя сенсора. Показывает, какому физическому размеру в фокальной плоскости соответствует один пиксель дисплея. Единица: мкм. Ключевое число: если фокусное расстояние (в мм) кратно этому значению — ошибка = 0%.",
    aspectOk: "Аспекты совпадают — оси H и V считаются одинаково",
    aspectWarn: "Аспекты разные — ошибки по H и V отличаются",
    formulas: "Формулы расчёта",
    fMradPx: "мрад/px — угловой размер одного пикселя дисплея в миллирадианах",
    fPxMrad: "px/мрад — сколько пикселей дисплея укладывается в 1 мрад. Цель: целое число",
    fError: "ошибка — отклонение px/мрад от ближайшего целого, в процентах",
    fMm100: "мм/100м — линейный размер 1 пикселя дисплея на дистанции 100 метров",
    fGoal: "Цель: найти F, при котором px/мрад ≈ целое. Тогда штрихи сетки точно ложатся в пиксели.",
    chartTitle: "Ошибка округления — худшая из H и V",
    good: "< 1% — идеально",
    ok: "< 5% — допустимо",
    bad: "> 5% — заметное плавание штрихов",
    tableTitle: "Результаты — сортировка по худшей ошибке ↑",
    tableCount: "фокусных в диапазоне",
    colF: "F, мм",
    colPpmH: "px/мрад H",
    colErrH: "Ош. H %",
    colPpmV: "px/мрад V",
    colErrV: "Ош. V %",
    colWorst: "Худш. %",
    colMmH: "мм/100м H",
    colMmV: "мм/100м V",
    tipF: "Фокусное расстояние объектива в мм. Чем больше — тем уже поле зрения и крупнее изображение.",
    tipPpmH: "Пикселей дисплея на 1 мрад по горизонтали. Идеально: целое число.",
    tipErrH: "Ошибка округления по горизонтали. 0% = идеальное попадание.",
    tipPpmV: "Пикселей дисплея на 1 мрад по вертикали.",
    tipErrV: "Ошибка округления по вертикали.",
    tipWorst: "Максимум из H и V. Определяет итоговое качество сетки.",
    tipMmH: "Линейный размер 1 пикселя на 100 м по горизонтали.",
    tipMmV: "Линейный размер 1 пикселя на 100 м по вертикали.",
    colDesc: "Описание колонок",
    descF: "Фокусное расстояние объектива в миллиметрах. Определяет угловое поле зрения и масштаб изображения на сенсоре.",
    descPpmH: "Количество пикселей дисплея на 1 миллирадиан по горизонтали. Идеально когда = целое число.",
    descErrH: "На сколько процентов px/мрад по горизонтали отличается от ближайшего целого.",
    descPpmV: "Аналогично px/мрад, но по вертикали. Отличается от H, если аспект сенсора ≠ аспекту дисплея.",
    descErrV: "Ошибка округления по вертикали.",
    descWorst: "Max(H, V). Сетка ровная только если обе оси дают малую ошибку.",
    descMm: "Линейный размер 1 пикселя дисплея на 100 м. Чем меньше — тем выше угловая точность.",
    whyTitle: "Почему это важно",
    why1: "Прицельная сетка цифрового тепловизионного прицела рисуется на пикселях микродисплея. Каждый пиксель = фиксированный угловой размер. Если деление сетки в 1 мрад не ложится в целое число пикселей — возникает дробная часть, которую приходится округлять.",
    why2: "Результат: штрихи «плавают» — одни шаги чуть шире, другие уже. На 100 м это незаметно, но на 500–1000 м ошибка округления даёт реальное отклонение точки попадания.",
    why3: "Правильный подбор объектива под пару сенсор + дисплей устраняет проблему в корне: 1 мрад = ровно N пикселей, без дробной части.",
  },
  en: {
    title: "Lens Selection",
    subtitle: "Find the focal length where 1 mrad maps to an exact integer number of display pixels on both axes",
    params: "Optical System Parameters",
    detector: "Sensor (detector)",
    detectorHint: "IR sensor resolution, px. Number of sensitive elements width × height. Defines how many points the lens captures.",
    pitch: "Sensor pixel pitch",
    pitchHint: "Physical size of one sensor pixel in micrometers. 12 µm — modern, 17 µm — standard, 25 µm — legacy sensors.",
    display: "Microdisplay (eyepiece)",
    displayHint: "Resolution of the OLED/LCD screen in the eyepiece that shows the sensor image. The reticle is drawn on these pixels.",
    focalFrom: "Focal from, mm",
    focalFromHint: "Start of the lens search range.",
    focalTo: "Focal to, mm",
    focalToHint: "End of range. Every mm is checked.",
    computed: "How the optical system works",
    scaleH: "Horizontal scale",
    scaleV: "Vertical scale",
    scaleExplain: "Sensor resolution ÷ display resolution. Shows how many sensor pixels correspond to one display pixel. If < 1, the image is upscaled (display is larger than sensor). Dimensionless ratio.",
    effH: "Eff. display pitch H",
    effV: "Eff. display pitch V",
    effExplain: "Scale × sensor pixel pitch. Shows what physical size in the focal plane corresponds to one display pixel. Unit: µm. Key number: if the focal length (mm) is a multiple of this value — error = 0%.",
    aspectOk: "Aspect ratios match — H and V axes are identical",
    aspectWarn: "Aspect ratios differ — H and V errors are different",
    formulas: "Calculation formulas",
    fMradPx: "mrad/px — angular size of one display pixel in milliradians",
    fPxMrad: "px/mrad — how many display pixels fit in 1 mrad. Goal: integer",
    fError: "error — deviation of px/mrad from nearest integer, in percent",
    fMm100: "mm/100m — linear size of 1 display pixel at 100 meters distance",
    fGoal: "Goal: find F where px/mrad ≈ integer. Then reticle marks land exactly on pixels.",
    chartTitle: "Rounding error — worst of H and V",
    good: "< 1% — ideal",
    ok: "< 5% — acceptable",
    bad: "> 5% — visible mark drift",
    tableTitle: "Results — sorted by worst error ↑",
    tableCount: "focal lengths in range",
    colF: "F, mm", colPpmH: "px/mrad H", colErrH: "Err H %", colPpmV: "px/mrad V", colErrV: "Err V %", colWorst: "Worst %", colMmH: "mm/100m H", colMmV: "mm/100m V",
    tipF: "Objective focal length in mm. Larger = narrower FOV, larger image.",
    tipPpmH: "Display pixels per 1 mrad horizontally. Ideal: integer.",
    tipErrH: "Rounding error horizontally. 0% = perfect fit.",
    tipPpmV: "Display pixels per 1 mrad vertically.",
    tipErrV: "Rounding error vertically.",
    tipWorst: "Max of H and V. Determines overall reticle quality.",
    tipMmH: "Linear size of 1 pixel at 100 m horizontally.",
    tipMmV: "Linear size of 1 pixel at 100 m vertically.",
    colDesc: "Column descriptions",
    descF: "Focal length in millimeters. Determines angular field of view and image scale on the sensor.",
    descPpmH: "Display pixels per 1 milliradian horizontally. Ideal when = integer.",
    descErrH: "How far px/mrad horizontally deviates from the nearest integer, in percent.",
    descPpmV: "Same as px/mrad, but vertically. Differs from H if sensor aspect ≠ display aspect.",
    descErrV: "Rounding error vertically.",
    descWorst: "Max(H, V). Reticle is crisp only when both axes have low error.",
    descMm: "Linear size of 1 display pixel at 100 m. Smaller = higher angular precision.",
    whyTitle: "Why this matters",
    why1: "A digital thermal sight reticle is drawn on microdisplay pixels. Each pixel = a fixed angular size. If a 1 mrad mark doesn't fall on a whole number of pixels — rounding occurs.",
    why2: "Result: marks 'float' — some steps are slightly wider, others narrower. At 100 m this is invisible, but at 500–1000 m the rounding error causes real point-of-impact shifts.",
    why3: "Choosing the right lens for a sensor + display pair eliminates this at the root: 1 mrad = exactly N pixels, no fractional part.",
  },
  zh: {
    title: "镜头选择", subtitle: "寻找焦距，使1毫弧度在两个轴上精确对应整数个显示像素",
    params: "光学系统参数", detector: "传感器（探测器）", detectorHint: "红外传感器分辨率，像素。宽度×高度的感光元件数量。",
    pitch: "传感器像素间距", pitchHint: "单个传感器像素的物理尺寸（微米）。12µm现代型，17µm标准型，25µm老式型。",
    display: "微型显示器（目镜）", displayHint: "目镜中OLED/LCD屏幕的分辨率，用于显示传感器图像。瞄准线在这些像素上绘制。",
    focalFrom: "焦距起始, mm", focalFromHint: "搜索范围起点。", focalTo: "焦距结束, mm", focalToHint: "搜索范围终点，每毫米检查。",
    computed: "光学系统工作原理", scaleH: "水平缩放比", scaleV: "垂直缩放比",
    scaleExplain: "传感器分辨率÷显示器分辨率。显示每个显示像素对应多少传感器像素。如果<1，图像被放大。无量纲比。",
    effH: "有效显示间距 H", effV: "有效显示间距 V",
    effExplain: "缩放比×传感器像素间距。显示焦平面中一个显示像素对应的物理尺寸。单位：µm。关键数值：焦距（mm）是此值的倍数时误差=0%。",
    aspectOk: "宽高比匹配——H和V轴相同", aspectWarn: "宽高比不同——H和V误差不同",
    formulas: "计算公式",
    fMradPx: "mrad/px — 一个显示像素的角度大小（毫弧度）", fPxMrad: "px/mrad — 1毫弧度对应多少显示像素。目标：整数",
    fError: "误差 — px/mrad偏离最近整数的百分比", fMm100: "mm/100m — 100米距离处1个显示像素的线性尺寸",
    fGoal: "目标：找到px/mrad≈整数的F值。此时瞄准线标记精确落在像素上。",
    chartTitle: "舍入误差——H和V中较大值", good: "< 1% — 理想", ok: "< 5% — 可接受", bad: "> 5% — 明显漂移",
    tableTitle: "结果——按最大误差排序 ↑", tableCount: "范围内的焦距",
    colF: "F, mm", colPpmH: "px/mrad H", colErrH: "误差H%", colPpmV: "px/mrad V", colErrV: "误差V%", colWorst: "最大%", colMmH: "mm/100m H", colMmV: "mm/100m V",
    tipF: "物镜焦距(mm)。越大视场越窄。", tipPpmH: "水平方向每mrad显示像素数。", tipErrH: "水平舍入误差。", tipPpmV: "垂直方向每mrad显示像素数。", tipErrV: "垂直舍入误差。", tipWorst: "H和V的最大值。", tipMmH: "100m处1像素水平线性尺寸。", tipMmV: "100m处1像素垂直线性尺寸。",
    colDesc: "列说明", descF: "焦距（毫米）。决定角视场和传感器上的图像比例。", descPpmH: "水平方向每毫弧度显示像素数。整数时最佳。", descErrH: "水平方向px/mrad偏离最近整数的百分比。", descPpmV: "与px/mrad相同，但为垂直方向。", descErrV: "垂直舍入误差。", descWorst: "Max(H,V)。两轴误差都小时瞄准线才清晰。", descMm: "100m处1个显示像素的线性尺寸。越小精度越高。",
    whyTitle: "为什么重要", why1: "数字热瞄准具的瞄准线绘制在微型显示器像素上。如果1mrad标记不能对应整数个像素就会产生舍入。", why2: "结果：标记\"漂移\"。在100m不明显，但500-1000m时会导致实际弹着点偏移。", why3: "为传感器+显示器选择正确的镜头从根本上消除此问题：1mrad=精确N个像素。",
  },
};

const LANG_KEY = "rika-calc-lang";

// ── Presets & Math ───────────────────────────────────────────────────

interface Preset { label: string; w: number; h: number }

const DETECTOR_PRESETS: Preset[] = [
  { label: "384×288", w: 384, h: 288 },
  { label: "640×480", w: 640, h: 480 },
  { label: "640×512", w: 640, h: 512 },
  { label: "1024×768", w: 1024, h: 768 },
  { label: "1280×1024", w: 1280, h: 1024 },
];
const DISPLAY_PRESETS: Preset[] = [
  { label: "640×480", w: 640, h: 480 },
  { label: "1024×768", w: 1024, h: 768 },
  { label: "1280×1024", w: 1280, h: 1024 },
  { label: "1920×1080", w: 1920, h: 1080 },
];
const PITCH_OPTIONS = [12, 15, 17, 25];

interface AxisResult { mpp: number; ppm: number; near: number; err: number; mm100: number; r: number }
interface RowResult { f: number; h: AxisResult; v: AxisResult; worst: number }

function calcAxis(sR: number, dR: number, p: number, f: number): AxisResult {
  const r = sR / dR;
  const mpp = (r * p) / f;
  const ppm = 1 / mpp;
  const near = Math.round(ppm);
  const err = near > 0 ? (Math.abs(ppm - near) / ppm) * 100 : 100;
  const mm100 = (r * p * 100) / f;
  return { mpp, ppm, near, err, mm100, r };
}

function calcRow(det: Preset, disp: Preset, p: number, f: number): RowResult {
  const h = calcAxis(det.w, disp.w, p, f);
  const v = calcAxis(det.h, disp.h, p, f);
  return { f, h, v, worst: Math.max(h.err, v.err) };
}

// ── Colors ───────────────────────────────────────────────────────────

const C = {
  bg: "#050505", card: "#0e0e0e", border: "#222",
  text: "#e8e8e8", dim: "#888", label: "#aaa", hint: "#666",
  green: "#00ff88", yellow: "#ffcc00", red: "#ff3344",
  H: "#00ccff", V: "#ff66ff",
};

function sc(p: number) { return p < 1 ? C.green : p < 5 ? C.yellow : C.red; }
function sbg(p: number) { return p < 1 ? "#00ff8810" : p < 5 ? "#ffcc0008" : "transparent"; }

// ── Logo (RIKA NV) ──────────────────────────────────────────────────

function RikaLogo() {
  return (
    <svg viewBox="100 205 640 185" style={{ height: 28, width: "auto" }} xmlns="http://www.w3.org/2000/svg">
      <path fill="#f15a22" d="m529.11,271.13h12.32v-2.46h-12.32v2.46Zm17.24-2.46v2.46h12.32v-2.46h-12.32Zm-3.69,16.01h2.46v-12.32h-2.46v12.32Zm0-17.24h2.46v-12.32h-2.46v12.32Z"/>
      <path fill="#f15a22" d="m231.96,260.76c8.16-8.69,8.06-15.95,7.09-19.83-.41-1.63-2.25-2.41-3.7-1.57l-3.45,1.53s4.31-14.67.72-22.72c-1.26-2.82-.56-6.2-5.37-6.88-3.35-.47-5.63.95-12.42,7.33-2.43,2.28-20.5,18.68-20.5,18.68,0,0-1.85-4.97-5.93-5.65-10.57-1.75-31.19,19.84-44.26,37.82-15.63,21.5-31.03,35.59-31.03,35.59,0,0,5.02,6.03,14.22,5.23-25.49,29.68-21.2,73.78-21.2,73.78,0,0,7.3-9.36,17.11-16.25,9.84-6.92,17.74-8.9,17.74-8.9l-9.99,17.27s21.15,3.25,40.46-4.81c11.36-4.74,17.55-11.42,22.17-16.94l-.14,10.97s14.74-2.98,22.09-17.36l1.21,8.18s14.11-13.47,14.11-32.02c0-23.55-11.5-27.84-11.79-41.14-.24-11,7.82-16.96,12.85-22.32Z"/>
      <path fill="#fff" d="m218.61,254.11s5.18-6.65,8.31-17.03c3.02-10.02,1.17-17.7,1.17-17.7l-7.08,4.3,1.25-4.89c-6.12,5.67-12.3,11.28-18.37,17-2.58,2.43-4.98,5.02-7.38,7.6-1.88,2.03-1.63,3.8-3.59,5.76-2.88,2.61-8.21,2.25-12.62,5.59,2.08-4.35,6.14-8.85,10.49-10.76l-2.62-5.99s-7.08,1.9-15.61,11.65c-7.5,8.57-13.26,23.86-13.26,23.86,0,0,8.12-7.19,13.45-9.81,8.48-4.17,16.77-3.67,16.77-3.67,0,0-13.86,2.41-23.48,16.38-5.97,8.67-6.51,15.9-6.51,15.9,0,0,8.07-6.24,14.08-9.01,9.14-4.21,17.8-3.96,17.8-3.96,0,0-11.79,9.69-.74,29.83,10.13,18.46-.74,30.82-.74,30.82,0,0,13.44.12,20.7-11.84,4.9-8.06,2.46-15.44,2.46-15.44,0,0,2.55,1.64,4.36,5.52,1.67,3.58,2.29,8.69,2.29,8.69,0,0,3.06-4.92,3.06-11.07,0-11.9-10.56-20.38-10.56-32.74,0-6.93,2.43-13.63,13.6-23.51,8.43-7.46,8.34-14.51,8.34-14.51l-15.53,9.04Z"/>
      <path fill="#e0e4ec" d="m515.75,257.01c-.4-1.13-1.47-1.89-2.67-1.89h-35.58c-1.2,0-2.27.76-2.67,1.89l-22.67,64.31c-.08.23-.4.23-.49,0-3.49-9.3-9.46-17.39-17.13-23.44-.16-.13-.16-.36,0-.49,11.77-9.3,19.59-23.38,20.47-39.29.09-1.62-1.22-2.98-2.84-2.98h-17.33c-1.49,0-2.7,1.16-2.82,2.65-1.28,15.42-13.62,27.68-29.16,28.49-.82.04-1.52-.59-1.52-1.41l-.09-26.9c0-1.56-1.27-2.83-2.83-2.83h-18.43c-1.57,0-2.83,1.27-2.83,2.83v79.37c0,1.57,1.27,2.83,2.83,2.83h18.7c1.57,0,2.84-1.27,2.83-2.84l-.09-26.87c0-.84.68-1.47,1.52-1.42,15.52.85,28.05,13.09,29.35,28.49.13,1.49,1.33,2.64,2.82,2.64h34.18c1.21,0,2.28-.76,2.68-1.9l21.97-62.94c.44-1.27,2.23-1.27,2.68,0l12.88,36.88c.64,1.83-.71,3.75-2.65,3.77l-14.42.07c-1.56.01-2.81,1.28-2.81,2.83v18.45c0,1.57,1.27,2.83,2.83,2.83h44.59c3.91,0,6.65-3.87,5.35-7.55l-26.64-75.59Zm-211.47-1.89h-27.78c-1.57,0-2.83,1.27-2.83,2.83v14.3c0,3.62-2.94,6.56-6.56,6.56h-14.7c-1.57,0-2.83,1.27-2.83,2.83v55.67c0,1.57,1.27,2.83,2.83,2.83h18.71c1.57,0,2.83-1.27,2.83-2.83v-51.83c0-3.62,2.94-6.56,6.56-6.56h24.14c3.74,0,7.02,2.88,7.12,6.62.1,3.84-2.98,6.98-6.8,6.98h-16.2c-1.57,0-2.83,1.27-2.83,2.83v18.26c0,1.39,1.12,2.7,2.51,2.84,11.47,1.14,20.06,10.02,21.18,21.2.14,1.37,1.43,2.49,2.81,2.49h18.19c1.55,0,2.83-1.25,2.84-2.79.07-15.83-8.68-25.36-10.35-27.03-.14-.14-.12-.38.04-.5,7.15-5.6,11.75-14.32,11.75-24.1h0c0-16.91-13.71-30.61-30.61-30.61Zm59.4,0h-18.43c-1.57,0-2.83,1.27-2.83,2.83v79.37c0,1.57,1.27,2.83,2.83,2.83h18.7c1.57,0,2.84-1.27,2.83-2.84l-.26-79.37c0-1.56-1.27-2.83-2.83-2.83Zm369.51,0h-19.77c-1.21,0-2.28.76-2.68,1.9l-21.97,62.94c-.44,1.27-2.23,1.27-2.68,0l-21.97-62.94c-.4-1.14-1.47-1.9-2.68-1.9h-34.77c-1.57,0-2.83,1.27-2.83,2.83v43.56c0,1.38-1.77,1.95-2.57.82l-32.91-46.03c-.53-.74-1.39-1.19-2.31-1.19h-19.8c-1.57,0-2.83,1.27-2.83,2.83v79.37c0,1.57,1.27,2.83,2.83,2.83h18.7c1.57,0,2.84-1.27,2.83-2.84l-.15-43.77c0-1.38,1.77-1.95,2.57-.82l32.78,46.25c.53.75,1.39,1.2,2.31,1.2h20.07c1.57,0,2.84-1.27,2.83-2.84l-.15-44.41c0-1.6,2.22-1.98,2.75-.48l16.16,45.84c.4,1.13,1.47,1.89,2.67,1.89h35.58c1.2,0,2.27-.76,2.67-1.89l27.97-79.37c.65-1.84-.72-3.78-2.67-3.78Z"/>
    </svg>
  );
}

// ── Flags ─────────────────────────────────────────────────────────────

const flagS: React.CSSProperties = { height: 16, width: 24, borderRadius: 2, display: "block" };

function FlagRU() {
  return (<svg viewBox="0 0 60 40" style={flagS}><rect width="60" height="13.33" fill="#FFF"/><rect y="13.33" width="60" height="13.34" fill="#0039A6"/><rect y="26.67" width="60" height="13.33" fill="#D52B1E"/></svg>);
}
function FlagEN() {
  return (<svg viewBox="0 0 60 40" style={flagS}><rect width="60" height="40" fill="#FFF"/><text x="30" y="21" textAnchor="middle" dominantBaseline="central" fill="#000" fontSize="18" fontWeight="bold" fontFamily="sans-serif">EN</text></svg>);
}
function FlagCN() {
  return (<svg viewBox="0 0 60 40" style={flagS}><rect width="60" height="40" fill="#DE2910"/><g fill="#FFDE00"><polygon points="10,4 11.2,7.6 15,7.6 12,9.8 13,13.4 10,11 7,13.4 8,9.8 5,7.6 8.8,7.6"/></g></svg>);
}

function LangSwitcher({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const langs = [
    { code: "en", Flag: FlagEN, label: "English" },
    { code: "ru", Flag: FlagRU, label: "Русский" },
    { code: "zh", Flag: FlagCN, label: "中文" },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {langs.map(({ code, Flag, label }) => (
        <button key={code} onClick={() => setLang(code)} title={label} style={{
          background: lang === code ? "#ffffff18" : "transparent",
          border: lang === code ? "1px solid #ffffff33" : "1px solid transparent",
          borderRadius: 4, padding: "3px 5px", cursor: "pointer", lineHeight: 0,
          opacity: lang === code ? 1 : 0.5, transition: "all 0.15s",
        }}>
          <Flag />
        </button>
      ))}
    </div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────

function ParamBlock({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 140, flex: "1 1 140px" }}>
      <label style={{ fontSize: 11, color: C.label, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
      <span style={{ fontSize: 10, color: C.hint, lineHeight: 1.5, maxWidth: 220 }}>{hint}</span>
    </div>
  );
}

function Sel({ value, onChange, options, render }: { value: number; onChange: (v: number) => void; options: any[]; render: (o: any) => string }) {
  return (<select value={value} onChange={e => onChange(Number(e.target.value))} style={inpS}>
    {options.map((o, i) => <option key={i} value={i}>{render(o)}</option>)}
  </select>);
}

function Num({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return <input type="number" value={value} min={min} max={max}
    onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
    style={{ ...inpS, width: 90 }} />;
}

const ChartTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.text, lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>F = {d.f} mm</div>
      <div><span style={{ color: C.H }}>H:</span> {d.eH.toFixed(2)}% — {d.pH.toFixed(3)} px/mrad</div>
      <div><span style={{ color: C.V }}>V:</span> {d.eV.toFixed(2)}% — {d.pV.toFixed(3)} px/mrad</div>
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 4 }}>
        Max: <span style={{ color: sc(d.w), fontWeight: 700 }}>{d.w.toFixed(2)}%</span>
      </div>
    </div>
  );
};

// ── Shared components ────────────────────────────────────────────────

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 20px", marginBottom: 20 }}>
      {title && <div style={secTitle}>{title}</div>}
      {children}
    </div>
  );
}

function TH({ children, align, w, color, tip }: { children?: React.ReactNode; align?: string; w?: number; color?: string; tip?: string }) {
  return (
    <th title={tip} style={{
      padding: "10px 10px", textAlign: (align || "left") as any, width: w,
      fontSize: 10, color: color || C.dim, fontWeight: 600, whiteSpace: "nowrap",
      fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.04em",
      cursor: tip ? "help" : "default",
    }}>{children}</th>
  );
}

const secTitle: React.CSSProperties = { fontSize: 11, color: C.label, marginBottom: 14, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em" };
const inpS: React.CSSProperties = { background: "#080808", color: "#e8e8e8", border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", outline: "none" };

function td(align: string, width?: number): React.CSSProperties {
  return { padding: "7px 10px", textAlign: (align || "left") as any, color: C.text, whiteSpace: "nowrap", ...(width ? { width } : {}) };
}

// ── Main ─────────────────────────────────────────────────────────────

export default function App() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "en"; } catch { return "en"; }
  });
  const t = (k: string) => T[lang]?.[k] ?? T.en[k] ?? k;

  const changeLang = (l: string) => {
    setLang(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  };

  const [detIdx, setDetIdx] = useState(2);
  const [dispIdx, setDispIdx] = useState(1);
  const [pitchIdx, setPitchIdx] = useState(0);
  const [fFrom, setFFrom] = useState(20);
  const [fTo, setFTo] = useState(75);

  const det = DETECTOR_PRESETS[detIdx];
  const disp = DISPLAY_PRESETS[dispIdx];
  const pitch = PITCH_OPTIONS[pitchIdx];

  const results = useMemo(() => {
    const lo = Math.min(fFrom, fTo), hi = Math.max(fFrom, fTo);
    return Array.from({ length: hi - lo + 1 }, (_, i) => calcRow(det, disp, pitch, lo + i));
  }, [det, disp, pitch, fFrom, fTo]);

  const sorted = useMemo(() => [...results].sort((a, b) => a.worst - b.worst), [results]);
  const top5 = useMemo(() => new Set(sorted.slice(0, 5).map(r => r.f)), [sorted]);

  const chart = useMemo(() =>
    [...results].sort((a, b) => a.f - b.f).map(r => ({
      f: r.f, eH: r.h.err, eV: r.v.err, pH: r.h.ppm, pV: r.v.ppm, w: r.worst,
    })), [results]);

  const rH = det.w / disp.w, rV = det.h / disp.h;
  const eH = rH * pitch, eV = rV * pitch;
  const aspOk = Math.abs(rH - rV) / Math.max(rH, rV) < 0.001;
  const lo = Math.min(fFrom, fTo), hi = Math.max(fFrom, fTo);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "0 16px 40px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 0 20px", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          <RikaLogo />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{t("title")}</h1>
          </div>
          <LangSwitcher lang={lang} setLang={changeLang} />
        </div>

        <p style={{ fontSize: 13, color: C.dim, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 720 }}>{t("subtitle")}</p>

        <Card title={t("params")}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <ParamBlock label={t("detector")} hint={t("detectorHint")}>
              <Sel value={detIdx} onChange={setDetIdx} options={DETECTOR_PRESETS} render={(p: Preset) => p.label + " px"} />
            </ParamBlock>
            <ParamBlock label={t("pitch")} hint={t("pitchHint")}>
              <Sel value={pitchIdx} onChange={setPitchIdx} options={PITCH_OPTIONS} render={(p: number) => p + " µm"} />
            </ParamBlock>
            <ParamBlock label={t("display")} hint={t("displayHint")}>
              <Sel value={dispIdx} onChange={setDispIdx} options={DISPLAY_PRESETS} render={(p: Preset) => p.label + " px"} />
            </ParamBlock>
            <ParamBlock label={t("focalFrom")} hint={t("focalFromHint")}>
              <Num value={fFrom} onChange={setFFrom} min={5} max={200} />
            </ParamBlock>
            <ParamBlock label={t("focalTo")} hint={t("focalToHint")}>
              <Num value={fTo} onChange={setFTo} min={5} max={200} />
            </ParamBlock>
          </div>
        </Card>

        <Card title={t("computed")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            <div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: C.H, fontWeight: 700 }}>{t("scaleH")}: {rH.toFixed(4)}</span>
                <span style={{ color: C.dim }}> = {det.w} ÷ {disp.w}</span>
              </div>
              <div>
                <span style={{ color: C.V, fontWeight: 700 }}>{t("scaleV")}: {rV.toFixed(4)}</span>
                <span style={{ color: C.dim }}> = {det.h} ÷ {disp.h}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.hint, lineHeight: 1.6 }}>{t("scaleExplain")}</div>
            <div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: C.H, fontWeight: 700 }}>{t("effH")}: {eH.toFixed(2)} µm</span>
                <span style={{ color: C.dim }}> = {rH.toFixed(4)} × {pitch}</span>
              </div>
              <div>
                <span style={{ color: C.V, fontWeight: 700 }}>{t("effV")}: {eV.toFixed(2)} µm</span>
                <span style={{ color: C.dim }}> = {rV.toFixed(4)} × {pitch}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.hint, lineHeight: 1.6 }}>{t("effExplain")}</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12 }}>
            {aspOk
              ? <span style={{ color: C.green }}>✓ {t("aspectOk")}</span>
              : <span style={{ color: C.yellow }}>⚠ {t("aspectWarn")}</span>}
          </div>
        </Card>

        <Card title={t("formulas")}>
          <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 2, color: C.text }}>
            <div><span style={{ color: C.dim }}>мрад/px =</span> (sensor ÷ display) × pitch ÷ F <span style={{ color: C.hint }}> — {t("fMradPx")}</span></div>
            <div><span style={{ color: C.dim }}>px/мрад =</span> 1 ÷ мрад/px <span style={{ color: C.hint }}> — {t("fPxMrad")}</span></div>
            <div><span style={{ color: C.dim }}>error =</span> |px/mrad − round(px/mrad)| ÷ px/mrad × 100% <span style={{ color: C.hint }}> — {t("fError")}</span></div>
            <div><span style={{ color: C.dim }}>mm/100m =</span> (sensor ÷ display) × pitch × 100 ÷ F <span style={{ color: C.hint }}> — {t("fMm100")}</span></div>
            <div style={{ marginTop: 8, color: C.green, fontSize: 11 }}>{t("fGoal")}</div>
          </div>
        </Card>

        <Card title={t("chartTitle")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="f" tick={{ fill: C.dim, fontSize: 10, fontFamily: "'JetBrains Mono'" }}
                interval={Math.max(0, Math.floor(chart.length / 20) - 1)}
                label={{ value: "F, mm", position: "insideBottomRight", offset: -2, fill: C.dim, fontSize: 10 }} />
              <YAxis tick={{ fill: C.dim, fontSize: 10, fontFamily: "'JetBrains Mono'" }}
                label={{ value: "%", position: "insideTopLeft", offset: 5, fill: C.dim, fontSize: 10 }} domain={[0, "auto"]} />
              <Tooltip content={<ChartTip />} />
              <ReferenceLine y={1} stroke={C.green} strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={5} stroke={C.yellow} strokeDasharray="4 4" strokeOpacity={0.5} />
              <Bar dataKey="w" radius={[2, 2, 0, 0]} maxBarSize={16}>
                {chart.map((e, i) => <Cell key={i} fill={sc(e.w)} fillOpacity={top5.has(e.f) ? 1 : 0.4} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "8px 0 4px", fontSize: 10, fontFamily: "'JetBrains Mono'" }}>
            <span><span style={{ color: C.green }}>■</span> {t("good")}</span>
            <span><span style={{ color: C.yellow }}>■</span> {t("ok")}</span>
            <span><span style={{ color: C.red }}>■</span> {t("bad")}</span>
          </div>
        </Card>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={secTitle}>{t("tableTitle")}</span>
            <span style={{ fontSize: 11, color: C.hint }}>{sorted.length} {t("tableCount")} {lo}–{hi} mm</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <TH w={30}/><TH align="center" tip={t("tipF")}>{t("colF")}</TH>
                  <TH align="right" color={C.H} tip={t("tipPpmH")}>{t("colPpmH")}</TH>
                  <TH align="right" color={C.H} tip={t("tipErrH")}>{t("colErrH")}</TH>
                  <TH align="right" color={C.V} tip={t("tipPpmV")}>{t("colPpmV")}</TH>
                  <TH align="right" color={C.V} tip={t("tipErrV")}>{t("colErrV")}</TH>
                  <TH align="right" tip={t("tipWorst")}>{t("colWorst")}</TH>
                  <TH align="right" tip={t("tipMmH")}>{t("colMmH")}</TH>
                  <TH align="right" tip={t("tipMmV")}>{t("colMmV")}</TH>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const isTop = top5.has(r.f);
                  return (
                    <tr key={r.f} style={{ borderBottom: `1px solid ${C.bg}`, background: isTop ? sbg(r.worst) : "transparent" }}>
                      <td style={td("center", 30)}><div style={{ width: 8, height: 8, borderRadius: "50%", background: sc(r.worst), display: "inline-block", boxShadow: r.worst < 1 ? `0 0 8px ${C.green}66` : "none" }} /></td>
                      <td style={{ ...td("center"), fontWeight: isTop ? 700 : 400, color: isTop ? "#fff" : C.text }}>
                        {r.f}
                        {i < 5 && <span style={{ fontSize: 9, color: C.green, marginLeft: 6, background: `${C.green}1a`, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>#{i + 1}</span>}
                      </td>
                      <td style={{ ...td("right"), color: C.H }}>{r.h.ppm.toFixed(3)}</td>
                      <td style={{ ...td("right"), fontWeight: 600, color: sc(r.h.err) }}>{r.h.err.toFixed(2)}</td>
                      <td style={{ ...td("right"), color: C.V }}>{r.v.ppm.toFixed(3)}</td>
                      <td style={{ ...td("right"), fontWeight: 600, color: sc(r.v.err) }}>{r.v.err.toFixed(2)}</td>
                      <td style={{ ...td("right"), fontWeight: 700, color: sc(r.worst), fontSize: 13 }}>{r.worst.toFixed(2)}</td>
                      <td style={{ ...td("right"), color: C.dim }}>{r.h.mm100.toFixed(2)}</td>
                      <td style={{ ...td("right"), color: C.dim }}>{r.v.mm100.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Card title={t("colDesc")}>
          <div style={{ fontSize: 12, color: C.dim, lineHeight: 2 }}>
            <div><strong style={{ color: C.text }}>{t("colF")}</strong> — {t("descF")}</div>
            <div><strong style={{ color: C.H }}>{t("colPpmH")}</strong> — {t("descPpmH")}</div>
            <div><strong style={{ color: C.H }}>{t("colErrH")}</strong> — {t("descErrH")}</div>
            <div><strong style={{ color: C.V }}>{t("colPpmV")}</strong> — {t("descPpmV")}</div>
            <div><strong style={{ color: C.V }}>{t("colErrV")}</strong> — {t("descErrV")}</div>
            <div><strong style={{ color: C.text }}>{t("colWorst")}</strong> — {t("descWorst")}</div>
            <div><strong style={{ color: C.text }}>{t("colMmH")}/{t("colMmV")}</strong> — {t("descMm")}</div>
          </div>
        </Card>

        <Card title={t("whyTitle")}>
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>{t("why1")}</p>
            <p style={{ margin: "0 0 8px" }}>{t("why2")}</p>
            <p style={{ margin: 0 }}>{t("why3")}</p>
          </div>
        </Card>

      </div>
    </div>
  );
}
