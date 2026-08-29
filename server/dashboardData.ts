type ApiOk<T> = { ok: true; data: T; updatedAt: string; source: string };
type ApiFail = { ok: false; message: "連接唔到"; updatedAt: null; source: string };
export type ApiResult<T> = ApiOk<T> | ApiFail;

const SMG = "https://xml.smg.gov.mo";
const DSAT = "https://bis.dsat.gov.mo/macauweb/routestation/bus";

async function fetchText(url: string, timeoutMs = 9000, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Macau-Live-Home-Dashboard/1.0", ...headers } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

async function fetchJson<T>(url: string, timeoutMs = 9000, headers: Record<string, string> = {}) {
  return JSON.parse(await fetchText(url, timeoutMs, { Accept: "application/json", ...headers })) as T;
}

async function safe<T>(source: string, fn: () => Promise<T>): Promise<ApiResult<T>> {
  try { return { ok: true, data: await fn(), updatedAt: new Date().toISOString(), source }; }
  catch (error) { console.warn(`[Macau dashboard] ${source} failed`, error); return { ok: false, message: "連接唔到", updatedAt: null, source }; }
}

function cleanXml(value: string | undefined) { return (value ?? "").replace(/<[^>]*>/g, "").replace(/&apos;/g, "'").replace(/&#176;/g, "°").trim(); }
function xmlValue(xml: string, tag: string, occurrence = 0) { const values = Array.from(xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))).map((match) => cleanXml(match[1])); return values[occurrence] ?? ""; }
function xmlBlocks(xml: string, tag: string) { return Array.from(xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))).map((match) => match[1]); }
function weatherLabel(value: string) { const map: Record<string, string> = { a1: "天晴", a2: "晴朗炎熱", a3: "部分時間有陽光", a4: "多雲", a5: "有驟雨", a6: "有雨", a7: "雷雨", a8: "有雷暴" }; return map[value.toLowerCase()] ?? "多雲有雨"; }
function dateLabel(date: string) { return `${date.slice(5, 7)}/${date.slice(8, 10)}`; }
function localDateString() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Macau", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function hktMidnightTimestamp(date: string) { return Date.parse(`${date}T00:00:00+08:00`); }

export async function getCurrentWeather(): Promise<ApiResult<{ place: string; temperature: number | null; humidity: number | null; condition: string; icon: string; wind: string; warning: string; observedAt: string | null }>> {
  return safe("澳門氣象局·即時天氣", async () => {
    const xml = await fetchText(`${SMG}/e_actual_brief.xml`);
    const temperature = Number(xmlValue(xml, "Value", 0));
    const humidity = Number(xmlValue(xml, "Value", 1));
    const windSpeed = xmlValue(xml, "Value", 2);
    const windDirection = xmlValue(xml, "Value", 3);
    const icon = xmlValue(xml, "WeatherStatus");
    return { place: "澳門", temperature: Number.isFinite(temperature) ? temperature : null, humidity: Number.isFinite(humidity) ? humidity : null, condition: weatherLabel(icon), icon, warning: "請留意澳門氣象局最新天氣警告", wind: `${windDirection || "—"} ${windSpeed ? `${windSpeed} km/h` : ""}`.trim(), observedAt: xmlValue(xml, "ValidFor") || xmlValue(xml, "SysPubdate") || null };
  });
}

export async function getForecast(): Promise<ApiResult<{ region: string; note: string; days: Array<{ date: string; weekday: string; min: number | null; max: number | null; rain: string; icon: string; iconLabel: string; psr: string }> }>> {
  return safe("澳門氣象局·七日＋Open-Meteo九日預報", async () => {
    const xml = await fetchText(`${SMG}/e_7daysforecast.xml`);
    const smgDays = xmlBlocks(xml, "WeatherForecast").map((block) => {
      const temps = xmlBlocks(block, "Temperature");
      const max = Number(xmlValue(temps[0] ?? "", "Value"));
      const min = Number(xmlValue(temps[1] ?? "", "Value"));
      const date = xmlValue(block, "ValidFor");
      const icon = xmlValue(block, "WeatherStatus");
      return { date, weekday: xmlValue(block, "e_DayOfWeek"), min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null, rain: xmlValue(block, "WeatherDescription"), icon, iconLabel: weatherLabel(icon), psr: "—" };
    });
    const om = await fetchJson<{ daily?: { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: number[]; weather_code?: number[] } }>("https://api.open-meteo.com/v1/forecast?latitude=22.1987&longitude=113.5439&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=9&timezone=Asia%2FMacau");
    const omDays = (om.daily?.time ?? []).map((date, index) => ({ date, weekday: new Date(`${date}T12:00:00+08:00`).toLocaleDateString("zh-HK", { weekday: "short", timeZone: "Asia/Macau" }), min: om.daily?.temperature_2m_min?.[index] ?? null, max: om.daily?.temperature_2m_max?.[index] ?? null, rain: "澳門區模型預報", icon: String(om.daily?.weather_code?.[index] ?? ""), iconLabel: "模型預報", psr: `${om.daily?.precipitation_probability_max?.[index] ?? "—"}%` }));
    const days = omDays.length >= 9 ? omDays : smgDays;
    return { region: "澳門區", note: "SMG 官方七日預報＋Open-Meteo 補足九日機器可讀資料；日數較長部分標示模型預報", days: days.slice(0, 9).map((day) => ({ ...day, date: dateLabel(day.date) })) };
  });
}

type FxApi = { result: string; base_code: string; time_last_update_utc: string; rates: Record<string, number> };
export async function getFx(): Promise<ApiResult<{ date: string; base: string; rows: Array<{ code: string; name: string; display: string; secondary: string }> }>> {
  return safe("ExchangeRate-API·澳門幣匯率", async () => {
    const result = await fetchJson<FxApi>("https://open.er-api.com/v6/latest/MOP");
    if (result.result !== "success" || result.base_code !== "MOP") throw new Error("Invalid MOP FX response");
    const names: Record<string, string> = { JPY: "日圓", USD: "美元", EUR: "歐元", CNY: "人民幣", GBP: "英鎊", SGD: "新加坡元" };
    const symbols: Record<string, string> = { USD: "US$", EUR: "€", CNY: "¥", GBP: "£", SGD: "S$" };
    const codes = ["JPY", "USD", "EUR", "CNY", "GBP", "SGD"];
    return { date: result.time_last_update_utc, base: "MOP", rows: codes.flatMap((code) => { const rate = result.rates[code]; if (!rate) return []; if (code === "JPY") return [{ code, name: names[code], display: `¥100 = MOP$${(100 / rate).toFixed(2)}`, secondary: `1 MOP = ¥${rate.toFixed(2)}` }]; return [{ code, name: names[code], display: `MOP$100 → ${symbols[code]}${(rate * 100).toFixed(2)}`, secondary: `1 ${code} = MOP$${(1 / rate).toFixed(2)}` }]; }) };
  });
}

type DsatResponse = { header?: string; data?: { routeInfo?: Array<{ staCode: string; busInfo?: Array<{ speed?: string; status?: string }> }> } };
const busQueries = [
  { id: "34-T338", route: "34", dir: "1", stop: "T338", stopName: "海洋花園衛生中心", label: "34 · T338 海洋花園衛生中心" },
  { id: "34-M222", route: "34", dir: "0", stop: "M222/2", stopName: "看台街", label: "34 · M222/2 看台街" },
  { id: "26-T337", route: "26", dir: "0", stop: "T337", stopName: "氹仔海濱花園", label: "26 · T337 氹仔海濱花園" },
  { id: "MT4-T337", route: "MT4", dir: "1", stop: "T337", stopName: "氹仔海濱花園", label: "MT4 · T337 氹仔海濱花園" },
  { id: "MT2-T337", route: "MT2", dir: "0", stop: "T337", stopName: "氹仔海濱花園", label: "MT2 · T337 氹仔海濱花園" },
  { id: "52-T337", route: "52", dir: "0", stop: "T337", stopName: "氹仔海濱花園", label: "52 · T337 氹仔海濱花園" },
  { id: "26-M16", route: "26", dir: "0", stop: "M16/1", stopName: "提督馬路/雅廉訪", label: "26 · M16/1 提督馬路/雅廉訪" },
];
export async function getBusEta(): Promise<ApiResult<{ note: string; routes: Array<{ id: string; route: string; stop: string; stopName: string; label: string; eta: string | null; minutes: number | null; estimate: boolean; detail: string }> }>> {
  return safe("澳門交通事務局·巴士即時位置", async () => {
    const feedCache = new Map<string, Promise<DsatResponse>>();
    const getFeed = (route: string, dir: string) => {
      const key = `${route}:${dir}`;
      const existing = feedCache.get(key);
      if (existing) return existing;
      const request = fetchJson<DsatResponse>(`${DSAT}?routeName=${encodeURIComponent(route)}&dir=${dir}`, 15_000, { Referer: "https://bis.dsat.gov.mo/macauweb/" });
      feedCache.set(key, request);
      return request;
    };
    const routes = await Promise.all(busQueries.map(async (query) => {
      try {
        const result = await getFeed(query.route, query.dir);
        const routeInfo = result.data?.routeInfo ?? [];
        const stopIndex = routeInfo.findIndex((station) => station.staCode === query.stop);
        if (stopIndex < 0) return { ...query, eta: null, minutes: null, estimate: true, detail: "此方向暫無站點資料" };
        const upstream = routeInfo.slice(0, stopIndex).flatMap((station, index) => (station.busInfo ?? []).map((bus) => ({ bus, stopsAway: stopIndex - index })));
        const nearest = upstream.sort((a, b) => a.stopsAway - b.stopsAway)[0];
        if (!nearest) return { ...query, eta: null, minutes: null, estimate: true, detail: "暫無車輛位置" };
        const speed = Number(nearest.bus.speed);
        const minutes = Math.max(1, Math.round(nearest.stopsAway * (speed > 25 ? 1.5 : 2.5)));
        const eta = new Date(Date.now() + minutes * 60000).toISOString();
        return { ...query, eta, minutes, estimate: true, detail: `前方約 ${nearest.stopsAway} 站 · 依即時位置估算` };
      } catch { return { ...query, eta: null, minutes: null, estimate: true, detail: "連接唔到" }; }
    }));
    return { note: "澳門交通事務局公開端點提供即時車輛位置；以下為依站點距離及車速推算的到站時間，並非官方保證班次", routes };
  });
}

export async function getHolidays(): Promise<ApiResult<{ year: number; next: { name: string; date: string; days: number } | null; upcoming: Array<{ name: string; date: string; days: number }> }>> {
  return safe("澳門政府·公眾假期 iCal", async () => {
    const text = await fetchText("https://www.gov.mo/zh-hant/public-holidays/ical/");
    const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Macau", year: "numeric" }).format(new Date()));
    const today = hktMidnightTimestamp(localDateString());
    const upcoming = Array.from(text.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)).map((match) => { const block = match[1]; const rawDate = block.match(/DTSTART(?:;VALUE=DATE)?:([0-9TZ]+)/)?.[1] ?? ""; const date = rawDate.length >= 8 ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : ""; const name = (block.match(/SUMMARY:(.*)/)?.[1] ?? "").replace(/\\,/g, ",").trim(); if (!date || !name) return null; const days = Math.ceil((hktMidnightTimestamp(date) - today) / 86400000); return days >= 0 ? { name, date, days } : null; }).filter((item): item is { name: string; date: string; days: number } => Boolean(item)).filter((item) => Number(item.date.slice(0, 4)) === year).sort((a, b) => a.date.localeCompare(b.date));
    return { year, next: upcoming[0] ?? null, upcoming: upcoming.slice(0, 5) };
  });
}

export async function getSun(): Promise<ApiResult<{ date: string; sunrise: string; sunset: string }>> {
  return safe("Open-Meteo·澳門日出日落", async () => {
    const result = await fetchJson<{ daily?: { time?: string[]; sunrise?: string[]; sunset?: string[] } }>("https://api.open-meteo.com/v1/forecast?latitude=22.1987&longitude=113.5439&daily=sunrise,sunset&forecast_days=1&timezone=Asia%2FMacau");
    return { date: result.daily?.time?.[0] ?? localDateString(), sunrise: result.daily?.sunrise?.[0]?.slice(11, 16) ?? "—", sunset: result.daily?.sunset?.[0]?.slice(11, 16) ?? "—" };
  });
}

type YahooChart = { chart?: { result?: Array<{ meta?: { currency?: string; regularMarketPrice?: number; chartPreviousClose?: number; symbol?: string }; timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
const marketDefinitions = [{ key: "hsi", label: "恒生指數", symbol: "%5EHSI", unit: "pts" }, { key: "sp500", label: "標普 500", symbol: "%5EGSPC", unit: "pts" }, { key: "nasdaq100", label: "納斯達克 100", symbol: "%5ENDX", unit: "pts" }, { key: "gold", label: "黃金", symbol: "GC=F", unit: "USD / oz" }] as const;
export async function getMarkets(): Promise<ApiResult<Array<{ key: string; label: string; symbol: string; unit: string; currency: string; price: number; change: number; changePct: number; points: Array<{ date: string; value: number }> }>>> {
  return safe("Yahoo Finance·環球市場", async () => Promise.all(marketDefinitions.map(async (definition) => { const result = await fetchJson<YahooChart>(`https://query1.finance.yahoo.com/v8/finance/chart/${definition.symbol}?range=1mo&interval=1d`); const chart = result.chart?.result?.[0]; if (!chart?.meta?.regularMarketPrice) throw new Error(`No quote for ${definition.key}`); const timestamps = chart.timestamp ?? []; const closes = chart.indicators?.quote?.[0]?.close ?? []; const points = timestamps.map((timestamp, index) => ({ timestamp, value: closes[index] })).filter((point): point is { timestamp: number; value: number } => typeof point.value === "number").slice(-10); const price = chart.meta.regularMarketPrice; const previous = chart.meta.chartPreviousClose ?? points.at(-2)?.value ?? price; return { key: definition.key, label: definition.label, symbol: chart.meta.symbol ?? definition.key, unit: definition.unit, currency: chart.meta.currency ?? "USD", price, change: price - previous, changePct: previous ? ((price - previous) / previous) * 100 : 0, points: points.map((point) => ({ date: new Date(point.timestamp * 1000).toLocaleDateString("zh-HK", { month: "numeric", day: "numeric" }), value: point.value })) }; })));
}
