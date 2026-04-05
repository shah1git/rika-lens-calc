import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

interface Preset { label: string; w: number; h: number }
interface AxisResult { ppm: number; err: number; mm100: number }
interface RowResult { f: number; h: AxisResult; v: AxisResult; score: number }
type SortMode = "both" | "vPriority" | "vOnly";

const T: Record<string, Record<string, string>> = {
  ru: {
    title: "Подбор объектива", subtitle: "Поиск фокусного расстояния, при котором 1 мрад точно укладывается в целое число пикселей микродисплея",
    params: "Параметры оптической системы",
    detector: "Сенсор (детектор)", detectorHint: "Разрешение ИК-матрицы. Ширина × высота.",
    pitch: "Шаг пикселя", pitchHint: "Размер пикселя в мкм. 12 — совр., 17 — стандарт, 25 — устар.",
    display: "Микродисплей", displayHint: "Разрешение OLED/LCD в окуляре.",
    focalFrom: "Фокус от, мм", focalFromHint: "Начало диапазона.", focalTo: "Фокус до, мм", focalToHint: "Конец. Шаг 1 мм.",
    computed: "Как работает оптическая система",
    scaleH: "Масштаб H", scaleV: "Масштаб V", scaleExplain: "Сенсор ÷ дисплей. Если < 1 — растягивается.",
    effH: "Эфф. шаг H", effV: "Эфф. шаг V", effExplain: "Масштаб × шаг. Если F кратно этому — ошибка 0%.",
    multiplesH: "Кратные для 0% по H:", multiplesV: "Кратные для 0% по V:", multiplesNone: "нет в диапазоне",
    aspectOk: "Аспекты совпадают", aspectWarn: "Аспекты разные — H и V отличаются",
    formulas: "Формулы",
    fMradPx: "мрад/px — угловой размер пикселя", fPxMrad: "px/мрад — пикселей на 1 мрад. Цель: целое",
    fError: "ошибка — отклонение от целого, %", fMm100: "мм/100м — размер пикселя на 100 м",
    fGoal: "Цель: px/мрад ≈ целое → штрихи точно на пикселях.",
    sortModeTitle: "Приоритет осей",
    modeBoth: "Обе оси равны", modeBothDesc: "Итоговая = max(H, V). Обе оси одинаково важны.",
    modeVPri: "Приоритет V", modeVPriDesc: "Сначала по V, затем по H. Вертикаль важнее — holdover и mil-ranging.",
    modeVOnly: "Только V", modeVOnlyDesc: "Итоговая = V. Горизонталь не участвует — ветровая поправка приблизительна.",
    sortModeWhy: "Почему вертикаль может быть важнее? Вертикальные деления используются для точных баллистических поправок (holdover) и определения дистанции (mil-ranging) — ошибка идёт прямо в промах по высоте. Горизонталь — поправка на ветер, которая сама по себе приблизительна.",
    chartTitle: "Итоговая ошибка округления",
    good: "< 1% идеально", ok: "< 5% допустимо", bad: "> 5% плавание",
    explainTitle: "Как читать таблицу",
    explainBoth: "Для каждого F считаются ДВЕ ошибки — H и V. Сетка ровная когда обе малые. Итоговая = max(H, V).",
    explainVPri: "Сортировка по ошибке V (вертикаль). При равных V — лучший H побеждает.",
    explainVOnly: "Учитывается только ошибка V. Горизонталь показана, но не влияет на рейтинг.",
    explainFormulaBoth: "Итоговая ошибка = max(Ош. H, Ош. V)",
    explainFormulaVPri: "Сортировка: сначала Ош. V ↑, затем Ош. H ↑",
    explainFormulaVOnly: "Итоговая ошибка = Ош. V",
    explainExample: "Пример:", explainSort: "Таблица отсортирована по итоговой ошибке.",
    tableTitle: "Результаты — по итоговой ошибке ↑", tableCount: "в диапазоне",
    colF: "F, мм", colPpmH: "px/мрад H", colErrH: "Ош. H %", colPpmV: "px/мрад V", colErrV: "Ош. V %",
    colWorst: "Итог. %", colMmH: "мм/100м H", colMmV: "мм/100м V",
    tipF: "Фокусное расстояние объектива в мм. Чем больше F — тем уже поле зрения, крупнее цель и больше пикселей на 1 мрад. Формула: px/мрад = F ÷ эфф.шаг. Увеличение F повышает потенциальную точность сетки, но сужает обзор.",
    tipPpmH: "Сколько пикселей микродисплея приходится на 1 мрад по горизонтали. Формула: F ÷ (сенсор÷дисплей × шаг_µм). Идеально: целое число (5.000, 6.000) — каждый штрих сетки попадает точно на границу пикселя. Если дробное (5.270) — штрихи рисуются между пикселями и «плавают». Дробная часть определяет ошибку.",
    tipErrH: "Ошибка округления по горизонтали — насколько px/мрад H отклоняется от ближайшего целого, в %. Формула: |px/мрад − round(px/мрад)| ÷ px/мрад × 100. 0% = идеально. < 1% отлично (зелёный). < 5% допустимо (жёлтый). > 5% заметное плавание (красный). Пример: ошибка 2% на 500м сдвигает штрих на 10 мм по горизонтали.",
    tipPpmV: "Сколько пикселей микродисплея приходится на 1 мрад по вертикали. Формула: F ÷ (сенсор÷дисплей × шаг_µм). Идеально: целое число — штрихи точно на пикселях. Вертикальная точность критичнее горизонтальной: по V строятся баллистические поправки (holdover) и определяется дистанция (mil-ranging). Ошибка по V = прямой промах по высоте.",
    tipErrV: "Ошибка округления по вертикали — отклонение px/мрад V от целого, в %. Критичнее горизонтальной: ветровая поправка (H) сама по себе приблизительна, а баллистическая (V) требует максимальной точности. 0% = идеально. < 1% отлично. < 5% допустимо. > 5% значительный сдвиг. Пример: ошибка 3% на 700м = 21 мм промаха по высоте.",
    tipWorst: "Итоговая ошибка — определяет позицию строки в рейтинге. Режим «Обе оси»: max(H, V) — берётся худшая из двух. «Приоритет V»: сортировка по V, при равных V — по H. «Только V»: только ошибка V, горизонталь игнорируется. Зелёный < 1% = идеально, жёлтый < 5% = допустимо, красный > 5% = заметное плавание штрихов.",
    tipMmH: "Размер одного пикселя дисплея на 100 м по горизонтали, мм. Определяет разрешение системы — минимальную деталь, которую можно различить. Формула: (сенсор÷дисплей) × шаг_µм × 100 ÷ F. На других дистанциях масштабируется линейно: на 500м = ×5, на 1000м = ×10.",
    tipMmV: "Размер одного пикселя дисплея на 100 м по вертикали, мм. Определяет разрешение вертикальной оси — критично для mil-ranging и holdover. Формула: (сенсор÷дисплей) × шаг_µм × 100 ÷ F. На 500м = ×5, на 1000м = ×10. Чем меньше — тем мельче деталь можно разрешить.",
    colDesc: "Описание колонок",
    descF: "Фокусное расстояние объектива (мм). Определяет px/мрад и поле зрения.",
    descPpmH: "Пикселей на 1 мрад по горизонтали. Целое число = штрихи точно на пикселях.",
    descErrH: "Отклонение px/мрад H от целого, в %. 0% — идеально. < 5% — допустимо.",
    descPpmV: "Пикселей на 1 мрад по вертикали. Критичнее H — holdover и mil-ranging.",
    descErrV: "Отклонение px/мрад V от целого, в %. Ошибка по V напрямую влияет на промах по высоте.",
    descWorst: "Итоговая ошибка — зависит от режима приоритета осей. Таблица отсортирована по этой колонке.",
    descMm: "Размер 1 пикселя на 100 м, мм. На других дистанциях линейно: ×5 на 500м, ×10 на 1000м.",
    whyTitle: "Почему это важно",
    why1: "Сетка рисуется на пикселях. Если 1 мрад ≠ целое — штрихи «плавают».",
    why2: "На 500–1000 м ошибка = реальное отклонение попадания.",
    why3: "Правильный объектив: 1 мрад = ровно N пикселей.",
    copyLink: "Скопировать ссылку", linkCopied: "✓ Скопировано", posError: "Ошибка позиции метки",
    compare: "Сравнение", compareHint: "Кликните на строку таблицы чтобы добавить в сравнение (макс. 9)",
    distTable: "Размер 1 пикселя на дистанции",
    pixelSize: "Размер 1 пикселя на дистанции", addCompare: "Добавить в сравнение +", removeCompare: "Убрать из сравнения ✕",
    expandHint: "Размер пикселя — физический размер, покрываемый 1 пикселем дисплея на данной дистанции. Ошибка позиции — насколько штрих сетки сдвинут от идеального положения из-за округления px/мрад.",
    dist: "Дист.", clickRowHint: "Кликните на строку чтобы раскрыть таблицу дистанций и добавить в сравнение",
    tipPixelSize: "Какой физический размер в миллиметрах покрывает один пиксель микродисплея на каждой дистанции. Это характеристика разрешения оптической системы — насколько мелкую деталь можно различить. Формула: (сенсор ÷ дисплей) × шаг_пикселя × дистанция ÷ фокусное. Не зависит от ошибки округления.",
    tipPosError: "На сколько миллиметров штрих прицельной сетки сдвинут от идеального положения на каждой дистанции из-за того, что px/мрад не целое число. Это реальная ошибка прицеливания. Формула: ошибка_% ÷ 100 × дистанция_м. Например: ошибка 2% на 500м = 10мм сдвига. Зелёный < 5мм, жёлтый < 20мм, красный ≥ 20мм.",
    tipDistCol: "Дистанция до цели в метрах. Ошибка растёт линейно с дистанцией — на 1000м ровно в 10 раз больше чем на 100м.",
    tipPixHCol: "Размер одного пикселя дисплея по горизонтали на данной дистанции, в миллиметрах. Чем меньше — тем выше разрешение системы в горизонтальной плоскости.",
    tipPixVCol: "Размер одного пикселя дисплея по вертикали на данной дистанции, в миллиметрах. Чем меньше — тем выше разрешение системы в вертикальной плоскости.",
    tipErrHCol: "Сдвиг штриха сетки по горизонтали от идеальной позиции, в миллиметрах. Влияет на точность ветровых поправок. Зелёный < 5мм, жёлтый < 20мм, красный ≥ 20мм.",
    tipErrVCol: "Сдвиг штриха сетки по вертикали от идеальной позиции, в миллиметрах. Критично для баллистических поправок (holdover) и определения дистанции (mil-ranging). Зелёный < 5мм, жёлтый < 20мм, красный ≥ 20мм.",
    tipModeBoth: "Итоговая ошибка = максимум из горизонтальной и вертикальной. Подходит когда важна равномерная точность по всем направлениям.",
    tipModeVPri: "Сортировка сначала по вертикальной ошибке. При равных V — выбирается лучший H. Для задач где вертикальные поправки (holdover, mil-ranging) важнее ветровых.",
    tipModeVOnly: "Только вертикальная ошибка определяет рейтинг. Горизонталь полностью игнорируется. Максимально прагматичный выбор под баллистику.",
    tipRowClick: "Кликните чтобы раскрыть таблицу дистанций.", tipPosCell: "мм — штрих сетки сдвинут от идеальной позиции на",
  },
  en: {
    title: "Objective Lens Selection", subtitle: "Find the focal length at which 1 mrad fits exactly into an integer number of microdisplay pixels",
    params: "Optical Parameters", detector: "Sensor", detectorHint: "IR resolution.", pitch: "Pixel pitch", pitchHint: "µm.",
    display: "Microdisplay", displayHint: "Eyepiece resolution.",
    focalFrom: "Focal from", focalFromHint: "Start.", focalTo: "Focal to", focalToHint: "End. Step 1mm.",
    computed: "How it works", scaleH: "Scale H", scaleV: "Scale V", scaleExplain: "Sensor÷display.",
    effH: "Eff. pitch H", effV: "Eff. pitch V", effExplain: "Scale×pitch. F multiple of this = 0%.",
    multiplesH: "0% H multiples:", multiplesV: "0% V multiples:", multiplesNone: "none in range",
    aspectOk: "Aspects match", aspectWarn: "Aspects differ",
    formulas: "Formulas", fMradPx: "mrad/px", fPxMrad: "px/mrad. Goal: integer", fError: "error %", fMm100: "mm/100m",
    fGoal: "Goal: px/mrad ≈ integer.",
    sortModeTitle: "Axis priority",
    modeBoth: "Both equal", modeBothDesc: "Overall = max(H,V).",
    modeVPri: "V priority", modeVPriDesc: "Sort by V first, then H. Vertical matters for holdover.",
    modeVOnly: "V only", modeVOnlyDesc: "Overall = V. H ignored — wind is approximate.",
    sortModeWhy: "Why vertical may matter more? Vertical marks are used for precise holdover and mil-ranging — error goes straight into elevation miss. Horizontal is wind, which is inherently approximate.",
    chartTitle: "Overall rounding error", good: "<1% ideal", ok: "<5% ok", bad: ">5% drift",
    explainTitle: "How to read the table",
    explainBoth: "Two errors per F. Crisp when both low. Overall = max(H,V).",
    explainVPri: "Sorted by V error. Equal V → better H wins.",
    explainVOnly: "Only V matters. H shown but doesn't affect rank.",
    explainFormulaBoth: "Overall = max(H, V)", explainFormulaVPri: "Sort: V↑, then H↑", explainFormulaVOnly: "Overall = V",
    explainExample: "Example:", explainSort: "Sorted by overall error.",
    tableTitle: "Results — overall error ↑", tableCount: "in range",
    colF: "F,mm", colPpmH: "px/mrad H", colErrH: "Err H%", colPpmV: "px/mrad V", colErrV: "Err V%",
    colWorst: "Overall%", colMmH: "mm/100m H", colMmV: "mm/100m V",
    tipF: "Objective focal length in mm. Larger F = narrower FOV, larger target, more pixels per mrad. Formula: px/mrad = F ÷ eff_pitch. Increasing F improves potential reticle precision but narrows the field of view.",
    tipPpmH: "How many microdisplay pixels fit in 1 mrad horizontally. Formula: F ÷ (sensor÷display × pitch_µm). Ideal: integer (5.000, 6.000) — every reticle mark lands exactly on a pixel boundary. If fractional (5.270) — marks are drawn between pixels and 'drift'. The fractional part determines the error.",
    tipErrH: "Horizontal rounding error — how far px/mrad H deviates from the nearest integer, in %. Formula: |px/mrad − round(px/mrad)| ÷ px/mrad × 100. 0% = ideal. < 1% excellent (green). < 5% acceptable (yellow). > 5% visible drift (red). Example: 2% error at 500m shifts a mark 10 mm horizontally.",
    tipPpmV: "How many microdisplay pixels fit in 1 mrad vertically. Formula: F ÷ (sensor÷display × pitch_µm). Ideal: integer — marks land exactly on pixels. Vertical precision is more critical than horizontal: V marks are used for holdover (ballistic correction) and mil-ranging (distance estimation). V error directly causes elevation miss.",
    tipErrV: "Vertical rounding error — deviation of px/mrad V from integer, in %. More critical than horizontal: windage (H) is inherently approximate, but holdover (V) demands maximum precision. 0% = ideal. < 1% excellent. < 5% acceptable. > 5% significant shift. Example: 3% error at 700m = 21 mm elevation miss.",
    tipWorst: "Overall error — determines the row's ranking position. 'Both equal' mode: max(H, V) — the worse axis wins. 'V priority': sorted by V first, equal V breaks tie by H. 'V only': only V error, horizontal ignored. Green < 1% = ideal, yellow < 5% = acceptable, red > 5% = visible reticle mark drift.",
    tipMmH: "Size of one display pixel at 100 m horizontally, in mm. Determines system resolution — the smallest detail you can distinguish. Formula: (sensor÷display) × pitch_µm × 100 ÷ F. Scales linearly with distance: at 500m = ×5, at 1000m = ×10.",
    tipMmV: "Size of one display pixel at 100 m vertically, in mm. Determines vertical resolution — critical for mil-ranging and holdover precision. Formula: (sensor÷display) × pitch_µm × 100 ÷ F. At 500m = ×5, at 1000m = ×10. Smaller = finer detail resolved.",
    colDesc: "Column descriptions",
    descF: "Objective focal length (mm). Determines px/mrad and field of view.",
    descPpmH: "Pixels per 1 mrad horizontally. Integer = reticle marks exactly on pixels.",
    descErrH: "Deviation of px/mrad H from integer, in %. 0% = ideal. < 5% = acceptable.",
    descPpmV: "Pixels per 1 mrad vertically. More critical than H — holdover and mil-ranging.",
    descErrV: "Deviation of px/mrad V from integer, in %. V error directly causes elevation miss.",
    descWorst: "Overall error — depends on axis priority mode. Table is sorted by this column.",
    descMm: "Size of 1 pixel at 100 m, mm. Scales linearly: ×5 at 500m, ×10 at 1000m.",
    whyTitle: "Why it matters", why1: "Reticle on pixels. Non-integer = drift.", why2: "500-1000m = real miss.", why3: "Right lens: 1 mrad = N px.",
    copyLink: "Copy link", linkCopied: "✓ Copied", posError: "Mark position error",
    compare: "Compare", compareHint: "Click a table row to add to comparison (max 9)",
    distTable: "1 pixel size at distance",
    pixelSize: "1 pixel size at distance", addCompare: "Add to comparison +", removeCompare: "Remove from comparison ✕",
    expandHint: "Pixel size — physical area covered by 1 display pixel at this distance. Position error — how far a reticle mark is shifted from its ideal position due to px/mrad rounding.",
    dist: "Dist.", clickRowHint: "Click a row to expand distance tables and add to comparison",
    tipPixelSize: "Physical size in millimeters covered by one microdisplay pixel at each distance. This is the optical system resolution — the smallest detail you can see. Formula: (sensor ÷ display) × pixel_pitch × distance ÷ focal. Independent of rounding error.",
    tipPosError: "How many millimeters a reticle mark is shifted from its ideal position at each distance because px/mrad is not an integer. This is the real aiming error. Formula: error_% ÷ 100 × distance_m. Example: 2% error at 500m = 10mm shift. Green < 5mm, yellow < 20mm, red ≥ 20mm.",
    tipDistCol: "Distance to target in meters. Error grows linearly with distance — at 1000m it is exactly 10× greater than at 100m.",
    tipPixHCol: "Size of one display pixel horizontally at this distance, in millimeters. Smaller = higher horizontal resolution.",
    tipPixVCol: "Size of one display pixel vertically at this distance, in millimeters. Smaller = higher vertical resolution.",
    tipErrHCol: "Horizontal reticle mark shift from ideal position, in millimeters. Affects windage correction accuracy. Green < 5mm, yellow < 20mm, red ≥ 20mm.",
    tipErrVCol: "Vertical reticle mark shift from ideal position, in millimeters. Critical for holdover and mil-ranging accuracy. Green < 5mm, yellow < 20mm, red ≥ 20mm.",
    tipModeBoth: "Overall error = max of horizontal and vertical. Best when uniform accuracy in all directions matters.",
    tipModeVPri: "Sort by vertical error first. Equal V → better H wins. For tasks where vertical corrections (holdover, mil-ranging) matter more than wind.",
    tipModeVOnly: "Only vertical error determines ranking. Horizontal is fully ignored. Most pragmatic choice for ballistics.",
    tipRowClick: "Click to expand distance tables.", tipPosCell: "mm — mark shifted from ideal position at",
  },
  zh: {
    title: "物镜选择", subtitle: "寻找1毫弧度精确对应微显示器整数像素数的焦距",
    params: "参数", detector: "传感器", detectorHint: "分辨率", pitch: "间距", pitchHint: "µm",
    display: "显示器", displayHint: "目镜", focalFrom: "焦距起", focalFromHint: "", focalTo: "焦距止", focalToHint: "",
    computed: "原理", scaleH: "缩放H", scaleV: "缩放V", scaleExplain: "传感器÷显示器",
    effH: "间距H", effV: "间距V", effExplain: "倍数时=0%",
    multiplesH: "H 0%:", multiplesV: "V 0%:", multiplesNone: "无",
    aspectOk: "匹配", aspectWarn: "不匹配",
    formulas: "公式", fMradPx: "mrad/px", fPxMrad: "px/mrad", fError: "误差", fMm100: "mm/100m", fGoal: "目标:整数",
    sortModeTitle: "轴优先级", modeBoth: "两轴等", modeBothDesc: "max(H,V)", modeVPri: "V优先", modeVPriDesc: "先V后H",
    modeVOnly: "仅V", modeVOnlyDesc: "仅V", sortModeWhy: "垂直用于弹道修正，更重要。",
    chartTitle: "综合误差", good: "<1%", ok: "<5%", bad: ">5%",
    explainTitle: "说明", explainBoth: "max(H,V)", explainVPri: "按V排序", explainVOnly: "仅V",
    explainFormulaBoth: "max(H,V)", explainFormulaVPri: "V↑,H↑", explainFormulaVOnly: "=V",
    explainExample: "示例:", explainSort: "按综合误差排序。",
    tableTitle: "结果↑", tableCount: "范围内",
    colF: "F", colPpmH: "H px/mr", colErrH: "H%", colPpmV: "V px/mr", colErrV: "V%",
    colWorst: "综合%", colMmH: "H mm", colMmV: "V mm",
    tipF: "物镜焦距（毫米）。焦距越大——视场越窄、目标越大、每mrad像素越多。公式：px/mrad = F ÷ 有效间距。增大F可提高瞄准线精度，但缩小视场。",
    tipPpmH: "水平方向每mrad对应多少微显示器像素。公式：F ÷ (传感器÷显示器 × 间距µm)。理想值为整数（5.000、6.000）——每个瞄准线标记恰好落在像素边界上。若为小数（5.270）——标记绘制在像素之间，会产生'漂移'。小数部分决定误差大小。",
    tipErrH: "水平舍入误差——px/mrad H偏离最近整数的百分比。公式：|px/mrad − round(px/mrad)| ÷ px/mrad × 100。0%=理想。<1%优秀（绿）。<5%可接受（黄）。>5%明显漂移（红）。实例：500m处2%误差使标记水平偏移10mm。",
    tipPpmV: "垂直方向每mrad对应多少微显示器像素。公式：F ÷ (传感器÷显示器 × 间距µm)。理想值为整数——标记恰好在像素上。垂直精度比水平更关键：V刻度用于弹道修正（holdover）和测距（mil-ranging）。V误差直接导致高度偏差。",
    tipErrV: "垂直舍入误差——px/mrad V偏离整数的百分比。比水平更关键：风偏修正（H）本身是近似的，而弹道修正（V）要求最高精度。0%=理想。<1%优秀。<5%可接受。>5%明显偏移。实例：700m处3%误差=21mm高度偏差。",
    tipWorst: "综合误差——决定该行在排名中的位置。'两轴等'模式：max(H,V)——取较差的轴。'V优先'：先按V排序，V相同时按H。'仅V'：只看V误差，忽略水平。绿色<1%=理想，黄色<5%=可接受，红色>5%=明显漂移。",
    tipMmH: "100m处一个显示像素的水平尺寸（毫米）。决定系统分辨率——能分辨的最小细节。公式：(传感器÷显示器)×间距µm×100÷F。与距离线性缩放：500m处=×5，1000m处=×10。",
    tipMmV: "100m处一个显示像素的垂直尺寸（毫米）。决定垂直轴分辨率——对测距和弹道修正精度至关重要。公式：(传感器÷显示器)×间距µm×100÷F。500m处=×5，1000m处=×10。越小=分辨细节越精细。",
    colDesc: "列说明",
    descF: "物镜焦距（mm）。决定px/mrad和视场。",
    descPpmH: "水平方向每mrad像素数。整数=标记恰好在像素上。",
    descErrH: "px/mrad H偏离整数的百分比。0%=理想。<5%=可接受。",
    descPpmV: "垂直方向每mrad像素数。比H更关键——弹道修正和测距。",
    descErrV: "px/mrad V偏离整数的百分比。V误差直接导致高度偏差。",
    descWorst: "综合误差——取决于轴优先级模式。表格按此列排序。",
    descMm: "100m处1像素尺寸（mm）。线性缩放：500m处×5，1000m处×10。",
    whyTitle: "原因", why1: "不对齐=舍入", why2: "远距偏移", why3: "选对镜头",
    copyLink: "复制链接", linkCopied: "✓ 已复制", posError: "标记位置误差",
    compare: "比较", compareHint: "点击表格行添加到比较（最多9）",
    distTable: "像素在距离处的大小",
    pixelSize: "像素在距离处的大小", addCompare: "添加到比较 +", removeCompare: "从比较中删除 ✕",
    expandHint: "像素大小——1个显示像素在该距离处覆盖的物理面积。位置误差——由于px/mrad舍入导致标记偏离理想位置的距离。",
    dist: "距离", clickRowHint: "点击行展开距离表并添加到比较",
    tipPixelSize: "每个微显示器像素在各距离处覆盖的物理尺寸（毫米）。这是光学系统的分辨率特征——能看到的最小细节。公式：(传感器÷显示器)×像素间距×距离÷焦距。与舍入误差无关。",
    tipPosError: "由于px/mrad不是整数，瞄准线标记在各距离处偏离理想位置多少毫米。这是实际的瞄准误差。公式：误差%÷100×距离m。示例：500m处2%误差=10mm偏移。绿色<5mm，黄色<20mm，红色≥20mm。",
    tipDistCol: "到目标的距离（米）。误差随距离线性增长——1000m处恰好是100m处的10倍。",
    tipPixHCol: "该距离处一个显示像素的水平尺寸（毫米）。越小=水平分辨率越高。",
    tipPixVCol: "该距离处一个显示像素的垂直尺寸（毫米）。越小=垂直分辨率越高。",
    tipErrHCol: "瞄准线水平偏移（毫米）。影响风偏修正精度。绿<5mm，黄<20mm，红≥20mm。",
    tipErrVCol: "瞄准线垂直偏移（毫米）。对弹道修正和测距精度至关重要。绿<5mm，黄<20mm，红≥20mm。",
    tipModeBoth: "综合误差=水平和垂直中的最大值。适用于各方向精度同等重要的场景。",
    tipModeVPri: "先按垂直误差排序。V相同时选择更好的H。适用于垂直修正比风偏更重要的任务。",
    tipModeVOnly: "仅垂直误差决定排名。完全忽略水平轴。最实用的弹道选择。",
    tipRowClick: "点击展开距离表。", tipPosCell: "mm——标记偏离理想位置于",
  },
};
const LANG_KEY = "rika-calc-lang";
const DETECTOR_PRESETS: Preset[] = [{label:"256×192",w:256,h:192},{label:"384×288",w:384,h:288},{label:"640×480",w:640,h:480},{label:"640×512",w:640,h:512},{label:"1024×768",w:1024,h:768},{label:"1280×1024",w:1280,h:1024}];
const DISPLAY_PRESETS: Preset[] = [{label:"640×480",w:640,h:480},{label:"1024×768",w:1024,h:768},{label:"1280×1024",w:1280,h:1024},{label:"1920×1080",w:1920,h:1080},{label:"2560×2560",w:2560,h:2560}];
const PITCH_OPTIONS = [12, 15, 17, 25];
const CMP_COLORS = ["#00ccff", "#ff66ff", "#ffcc00", "#00ff88", "#ff6644", "#aa88ff", "#88ddff", "#ffaa33", "#ff4488"];
const DISTANCES = [100, 200, 300, 500, 700, 1000];
function parseHash(): Record<string, string> { try { const p: Record<string, string> = {}; window.location.hash.slice(1).split('&').forEach(s => { const [k, v] = s.split('='); if (k && v) p[k] = v; }); return p; } catch { return {}; } }
const _hp = parseHash();

function calcAxis(sR: number, dR: number, p: number, f: number): AxisResult {
  const r = sR / dR, ppm = f / (r * p), near = Math.round(ppm);
  const err = near > 0 ? (Math.abs(ppm - near) / ppm) * 100 : 100;
  return { ppm, err, mm100: (r * p * 100) / f };
}
function getScore(h: AxisResult, v: AxisResult, mode: SortMode): number {
  return mode === "both" ? Math.max(h.err, v.err) : v.err;
}
function sortRows(rows: RowResult[], mode: SortMode): RowResult[] {
  return [...rows].sort((a, b) => {
    if (mode === "vPriority") { const d = a.v.err - b.v.err; if (Math.abs(d) > 0.001) return d; return a.h.err - b.h.err; }
    return a.score - b.score;
  });
}
function findMultiples(ep: number, lo: number, hi: number): number[] {
  const r: number[] = [];
  for (let f = lo; f <= hi; f++) if (Math.abs(f / ep - Math.round(f / ep)) < 0.0001) r.push(f);
  return r;
}

const C = {
  bg: "#050505", card: "#0e0e0e", border: "#222", text: "#e8e8e8", dim: "#888", label: "#aaa", hint: "#666",
  green: "#00ff88", yellow: "#ffcc00", red: "#ff3344", H: "#00ccff", V: "#ff66ff",
  xBg: "#0c1a14", xBrd: "#1a3a28",
};
function sc(p: number) { return p < 1 ? C.green : p < 5 ? C.yellow : C.red; }
function sbg(p: number) { return p < 1 ? "#00ff8810" : p < 5 ? "#ffcc0008" : "transparent"; }

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

const fS: React.CSSProperties = { height: 16, width: 24, borderRadius: 2, display: "block" };
function FlagRU() { return (<svg viewBox="0 0 60 40" style={fS}><rect width="60" height="13.33" fill="#FFF"/><rect y="13.33" width="60" height="13.34" fill="#0039A6"/><rect y="26.67" width="60" height="13.33" fill="#D52B1E"/></svg>); }
function FlagEN() { return (<svg viewBox="0 0 60 40" style={fS}><rect width="60" height="40" fill="#FFF"/><text x="30" y="21" textAnchor="middle" dominantBaseline="central" fill="#000" fontSize="18" fontWeight="bold" fontFamily="sans-serif">EN</text></svg>); }
function FlagCN() { return (<svg viewBox="0 0 60 40" style={fS}><rect width="60" height="40" fill="#DE2910"/><g fill="#FFDE00"><polygon points="10,4 11.2,7.6 15,7.6 12,9.8 13,13.4 10,11 7,13.4 8,9.8 5,7.6 8.8,7.6"/></g></svg>); }
function LangSw({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const ls = [{ c: "en", F: FlagEN }, { c: "ru", F: FlagRU }, { c: "zh", F: FlagCN }];
  return (<div style={{ display: "flex", gap: 4 }}>{ls.map(({ c, F }) => (
    <button key={c} onClick={() => setLang(c)} style={{ background: lang === c ? "#ffffff18" : "transparent", border: lang === c ? "1px solid #ffffff33" : "1px solid transparent", borderRadius: 4, padding: "3px 5px", cursor: "pointer", lineHeight: 0, opacity: lang === c ? 1 : 0.5 }}><F /></button>
  ))}</div>);
}

const mn = "'JetBrains Mono', monospace";
const sS: React.CSSProperties = { fontSize: 11, color: C.label, marginBottom: 14, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.1em" };
const iS: React.CSSProperties = { background: "#080808", color: "#e8e8e8", border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px", fontSize: 14, fontFamily: mn, cursor: "pointer", outline: "none" };
function td(a: string, w?: number): React.CSSProperties { return { padding: "7px 10px", textAlign: a as any, color: C.text, whiteSpace: "nowrap", ...(w ? { width: w } : {}) }; }
function PB({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) { return (<div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 140, flex: "1 1 140px" }}><label style={{ fontSize: 11, color: C.label, fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>{children}<span style={{ fontSize: 10, color: C.hint, lineHeight: 1.5, maxWidth: 220 }}>{hint}</span></div>); }
function Sel({ value, onChange, options, render }: { value: number; onChange: (v: number) => void; options: any[]; render: (o: any) => string }) { return (<select value={value} onChange={e => onChange(Number(e.target.value))} style={iS}>{options.map((o: any, i: number) => <option key={i} value={i}>{render(o)}</option>)}</select>); }
function Nm({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const [draft, setDraft] = useState<string>(String(value));
  const committed = useRef(value);
  if (value !== committed.current) { committed.current = value; setDraft(String(value)); }
  return <input type="number" value={draft} min={min} max={max}
    onChange={e => setDraft(e.target.value)}
    onBlur={() => { const n = Math.max(min, Math.min(max, Number(draft) || min)); committed.current = n; setDraft(String(n)); onChange(n); }}
    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    style={{ ...iS, width: 90 }} />;
}
function Cd({ title, children }: { title?: string; children: React.ReactNode }) { return (<div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 20px", marginBottom: 20 }}>{title && <div style={sS}>{title}</div>}{children}</div>); }
function TH({ children, align, w, color, tip }: { children?: React.ReactNode; align?: string; w?: number; color?: string; tip?: string }) { return (<th title={tip || undefined} style={{ padding: "10px", textAlign: (align || "left") as any, width: w, fontSize: 10, color: color || C.dim, fontWeight: 600, whiteSpace: "nowrap", fontFamily: mn, textTransform: "uppercase", letterSpacing: "0.04em", cursor: tip ? "help" : "default" }}>{children}</th>); }
const CTip = ({ active, payload }: any) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; if (!d) return null; return (<div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", fontFamily: mn, fontSize: 11, color: C.text, lineHeight: 1.8 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>F={d.f}mm</div><div><span style={{ color: C.H }}>H:</span> {d.eH.toFixed(2)}%</div><div><span style={{ color: C.V }}>V:</span> {d.eV.toFixed(2)}%</div></div>); };

function SortMode({ mode, setMode, t }: { mode: SortMode; setMode: (m: SortMode) => void; t: (k: string) => string }) {
  const ms: { k: SortMode; l: string; d: string; c: string; tp: string }[] = [{ k: "both", l: t("modeBoth"), d: t("modeBothDesc"), c: C.text, tp: t("tipModeBoth") }, { k: "vPriority", l: t("modeVPri"), d: t("modeVPriDesc"), c: C.V, tp: t("tipModeVPri") }, { k: "vOnly", l: t("modeVOnly"), d: t("modeVOnlyDesc"), c: C.V, tp: t("tipModeVOnly") }];
  return (<Cd title={t("sortModeTitle")}><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>{ms.map(m => (<button key={m.k} onClick={() => setMode(m.k)} title={m.tp} style={{ background: mode === m.k ? (m.c === C.text ? "#ffffff12" : m.c + "18") : "transparent", border: `1.5px solid ${mode === m.k ? (m.c === C.text ? "#ffffff44" : m.c) : C.border}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer", textAlign: "left", flex: "1 1 180px" }}><div style={{ fontSize: 13, fontWeight: 700, color: mode === m.k ? m.c : C.dim, fontFamily: mn, marginBottom: 3 }}>{m.l}</div><div style={{ fontSize: 10, color: mode === m.k ? C.label : C.hint, lineHeight: 1.4 }}>{m.d}</div></button>))}</div><p style={{ fontSize: 11, color: C.hint, lineHeight: 1.6, margin: 0 }}>{t("sortModeWhy")}</p></Cd>);
}

function Explain({ sorted, mode, t }: { sorted: RowResult[]; mode: SortMode; t: (k: string) => string }) {
  const t1 = sorted[0]; if (!t1 || sorted.length < 2) return null;
  const c2 = sorted.length > 5 ? sorted[5] : sorted[sorted.length - 1];
  const txt = mode === "both" ? t("explainBoth") : mode === "vPriority" ? t("explainVPri") : t("explainVOnly");
  const frm = mode === "both" ? t("explainFormulaBoth") : mode === "vPriority" ? t("explainFormulaVPri") : t("explainFormulaVOnly");
  function sl(r: RowResult) { if (mode === "both") return `max(${r.h.err.toFixed(2)}, ${r.v.err.toFixed(2)}) = ${r.score.toFixed(2)}%`; if (mode === "vOnly") return `V = ${r.v.err.toFixed(2)}%`; return `V=${r.v.err.toFixed(2)}% H=${r.h.err.toFixed(2)}%`; }
  const ms: React.CSSProperties = { fontFamily: mn, fontWeight: 700 };
  return (<div style={{ background: C.xBg, border: `1px solid ${C.xBrd}`, borderRadius: 8, padding: "16px 20px", marginBottom: 20 }}>
    <div style={{ ...sS, color: C.green, marginBottom: 12 }}>{t("explainTitle")}</div>
    <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.7, margin: "0 0 12px" }}>{txt}</p>
    <div style={{ background: "#081210", borderRadius: 6, padding: "10px 16px", marginBottom: 14, fontFamily: mn, fontSize: 14, color: C.green, textAlign: "center" }}>{frm}</div>
    <div style={{ fontSize: 12, color: C.label, marginBottom: 6 }}>{t("explainExample")}</div>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
      <div style={{ flex: "1 1 280px", background: "#081a10", border: `1px solid ${C.green}33`, borderRadius: 6, padding: "10px 14px" }}>
        <div style={{ fontSize: 13, color: C.green, ...ms, marginBottom: 4 }}>F={t1.f}мм → #1</div>
        <div style={{ fontSize: 12, color: C.dim, fontFamily: mn }}><span style={{ color: C.H }}>H:{t1.h.err.toFixed(2)}%</span> <span style={{ color: C.V }}>V:{t1.v.err.toFixed(2)}%</span></div>
        <div style={{ fontSize: 11, color: C.green, fontFamily: mn, marginTop: 4 }}>{sl(t1)}</div>
      </div>
      <div style={{ flex: "1 1 280px", background: "#1a1408", border: `1px solid ${C.yellow}33`, borderRadius: 6, padding: "10px 14px" }}>
        <div style={{ fontSize: 13, color: C.yellow, ...ms, marginBottom: 4 }}>F={c2.f}мм → #{sorted.indexOf(c2) + 1}</div>
        <div style={{ fontSize: 12, color: C.dim, fontFamily: mn }}><span style={{ color: C.H }}>H:{c2.h.err.toFixed(2)}%</span> <span style={{ color: C.V }}>V:{c2.v.err.toFixed(2)}%</span></div>
        <div style={{ fontSize: 11, color: C.yellow, fontFamily: mn, marginTop: 4 }}>{sl(c2)}</div>
      </div>
    </div>
    <p style={{ fontSize: 12, color: C.label, lineHeight: 1.6, margin: 0, borderTop: `1px solid ${C.xBrd}`, paddingTop: 10 }}>{t("explainSort")}</p>
  </div>);
}

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
  useEffect(() => { window.location.hash = `det=${dI}&disp=${dpI}&pitch=${pI}&from=${fF}&to=${fT}&mode=${sm}&lang=${lang}`; }, [dI, dpI, pI, fF, fT, sm, lang]);
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

  return (<div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI',system-ui,sans-serif", padding: "0 16px 40px" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 0 20px", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        <RikaLogo /><h1 style={{ flex: 1, fontSize: 18, fontWeight: 700, margin: 0, color: "#fff", fontFamily: mn }}>{t("title")} <span style={{ fontSize: 11, fontWeight: 400, color: C.hint }}>v4.6.0</span></h1><button onClick={copyLink} style={{ background: copied ? "#00ff8818" : "#ffffff08", border: `1px solid ${copied ? C.green : C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, color: copied ? C.green : C.dim, cursor: "pointer", fontFamily: mn, whiteSpace: "nowrap" }}>{copied ? t("linkCopied") : t("copyLink")}</button><LangSw lang={lang} setLang={cl} />
      </div>
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

      <SortMode mode={sm} setMode={setSm} t={t} />

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
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: mn }}>F = {f} mm</span>
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
    </div>
  </div>);
}
