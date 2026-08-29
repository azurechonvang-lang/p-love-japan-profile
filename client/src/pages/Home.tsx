import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleHelp,
  CloudRain,
  CloudSun,
  Clock3,
  ExternalLink,
  MapPin,
  Menu,
  RefreshCw,
  Settings2,
  Sun,
  TrainFront,
  Umbrella,
  Waves,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Settings = {
  routes: string[];
  density: "compact" | "relaxed";
};

const DEFAULT_SETTINGS: Settings = {
  routes: ["34-T338", "34-M222", "26-T337", "MT4-T337", "MT2-T337", "52-T337", "26-M16"],
  density: "compact",
};
const ROUTE_OPTIONS = [{ id: "34-T338", label: "34 · T338" }, { id: "34-M222", label: "34 · M222/2" }, { id: "26-T337", label: "26 · T337" }, { id: "MT4-T337", label: "MT4 · T337" }, { id: "MT2-T337", label: "MT2 · T337" }, { id: "52-T337", label: "52 · T337" }, { id: "26-M16", label: "26 · M16/1" }];

function readSettings(): Settings {
  try {
    const stored = localStorage.getItem("macau-live-dashboard-settings-v2");
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<Settings>;
    return {
      routes: Array.isArray(parsed.routes) ? parsed.routes.filter((route) => ROUTE_OPTIONS.some((option) => option.id === route)) : DEFAULT_SETTINGS.routes,
      density: parsed.density === "relaxed" ? "relaxed" : "compact",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Macau" });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("zh-HK", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Macau" });
}

function dateLabel() {
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Macau", month: "long", day: "numeric", weekday: "long" }).format(new Date());
}

function SourceLine({ source, updatedAt }: { source: string; updatedAt?: string | null }) {
  return <div className="source-line"><span>{source}</span><span>{updatedAt ? `更新 ${formatTime(updatedAt)}` : "等待資料"}</span></div>;
}

function RefreshButton({ onClick, loading, label = "更新" }: { onClick: () => void; loading?: boolean; label?: string }) {
  return <button className="icon-button" onClick={onClick} aria-label={label} title={label}><RefreshCw size={14} className={loading ? "spin" : ""} /></button>;
}

function StateMessage({ text = "連接唔到" }: { text?: string }) {
  return <div className="state-message"><CircleHelp size={16} /><span>{text}</span></div>;
}

function WeatherCard() {
  const query = trpc.dashboard.weather.useQuery(undefined, { refetchInterval: 600_000, staleTime: 120_000 });
  const result = query.data;
  const weather = result?.ok ? result.data : null;
  return <section className="card weather-card" id="weather">
    <div className="card-topline"><div className="eyebrow">NOW · MACAU</div><RefreshButton onClick={() => query.refetch()} loading={query.isFetching} /></div>
    {weather ? <>
      <div className="weather-main"><div><div className="location"><MapPin size={14} /> {weather.place}</div><div className="temperature">{weather.temperature ?? "—"}<span>°</span></div><div className="condition">{weather.condition}</div></div><div className="weather-orb"><CloudSun size={54} strokeWidth={1.4} /></div></div>
      <div className="metric-row"><div><span>濕度</span><strong>{weather.humidity ?? "—"}%</strong></div><div><span>風向</span><strong>{weather.wind}</strong></div></div>
      <div className="weather-note"><Umbrella size={14} /> {weather.warning}</div>
      <SourceLine source="澳門氣象局·即時天氣" updatedAt={result?.updatedAt} />
    </> : <StateMessage text={query.isLoading ? "載入緊…" : "連接唔到"} />}
  </section>;
}

function ForecastCard() {
  const query = trpc.dashboard.forecast.useQuery(undefined, { refetchInterval: 600_000, staleTime: 120_000 });
  const result = query.data;
  const forecast = result?.ok ? result.data : null;
  return <section className="card forecast-card" id="forecast">
    <div className="card-topline"><div><div className="eyebrow">NEXT 9 DAYS</div><h3>{forecast?.region ?? "澳門區"}<span className="muted-title">天氣預報</span></h3></div><RefreshButton onClick={() => query.refetch()} loading={query.isFetching} /></div>
    {forecast ? <><div className="forecast-strip">{forecast.days.map((day, index) => <div className={`forecast-day ${index === 0 ? "today" : ""}`} key={`${day.date}-${day.weekday}`}><div className="forecast-date">{index === 0 ? "今日" : day.date}</div><div className="forecast-week">{day.weekday}</div><div className="forecast-icon">{Number(day.icon) >= 60 ? <CloudRain size={22} /> : <CloudSun size={22} />}</div><div className="forecast-temp"><strong>{day.max}°</strong><span>{day.min}°</span></div><div className="forecast-rain">{day.psr} <span>雨勢</span></div></div>)}</div><div className="forecast-caption">{forecast.note}</div><SourceLine source="澳門氣象局·九日預報" updatedAt={result?.updatedAt} /></> : <StateMessage text={query.isLoading ? "載入緊…" : "連接唔到"} />}
  </section>;
}

function BusCard({ selectedRoutes }: { selectedRoutes: string[] }) {
  const query = trpc.dashboard.bus.useQuery(undefined, { refetchInterval: 60_000, staleTime: 20_000 });
  const result = query.data;
  const bus = result?.ok ? result.data : null;
  const routes = bus?.routes.filter((item) => selectedRoutes.includes(item.id)) ?? [];
  return <section className="card bus-card" id="bus">
    <div className="card-topline"><div><div className="eyebrow">NEXT DEPARTURES · DSAT</div><h3>澳門巴士 <span className="muted-title">出發</span></h3></div><RefreshButton onClick={() => query.refetch()} loading={query.isFetching} /></div>
    {bus ? <><div className="bus-table"><div className="bus-header"><span>路線</span><span>車站</span><span>下一班</span></div>{routes.map((row) => <div className="bus-row" key={row.id}><div className="route-chip">{row.route}<small>{row.stop}</small></div><div className="bus-bay">{row.stopName}<small>{row.stop} · {row.detail}</small></div><div className="bus-next">{row.minutes === 0 ? <strong className="arriving">即將到站</strong> : row.minutes !== null ? <><strong>{row.minutes}<em>分鐘</em></strong><small>{formatTime(row.eta)}</small></> : <span className="muted">—</span>}</div></div>)}</div><div className="bus-footnote"><TrainFront size={14} /> 資料取自澳門交通事務局 · 約每 1 分鐘更新（到站時間為估算）</div><SourceLine source="DSAT Open Data·位置估算" updatedAt={result?.updatedAt} /></> : <StateMessage text={query.isLoading ? "載入緊…" : "連接唔到"} />}
  </section>;
}

function HolidayCard() {
  const query = trpc.dashboard.holidays.useQuery(undefined, { refetchInterval: 3_600_000, staleTime: 1_800_000 });
  const result = query.data;
  const holidays = result?.ok ? result.data : null;
  return <section className="card holiday-card" id="holiday">
    <div className="card-topline"><div><div className="eyebrow">UP NEXT · {holidays?.year ?? new Date().getFullYear()}</div><h3>公眾假期倒數</h3></div><RefreshButton onClick={() => query.refetch()} loading={query.isFetching} /></div>
    {holidays?.next ? <><div className="holiday-main"><div className="holiday-count"><strong>{holidays.next.days}</strong><span>日</span></div><div><span className="holiday-label">下一個假期</span><h4>{holidays.next.name}</h4><p>{new Date(`${holidays.next.date}T00:00:00+08:00`).toLocaleDateString("zh-HK", { month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Macau" })}</p></div></div><div className="holiday-mini-list">{holidays.upcoming.slice(1, 4).map((holiday) => <div key={holiday.date}><span>{holiday.name}</span><strong>{holiday.days}日</strong></div>)}</div><SourceLine source="澳門政府·公眾假期" updatedAt={result?.updatedAt} /></> : <StateMessage text={query.isLoading ? "載入緊…" : "連接唔到"} />}
  </section>;
}

function SunCard() {
  const query = trpc.dashboard.sun.useQuery(undefined, { refetchInterval: 3_600_000, staleTime: 1_800_000 });
  const result = query.data;
  const sun = result?.ok ? result.data : null;
  return <section className="card sun-card" id="sun">
    <div className="card-topline"><div><div className="eyebrow">SKY CLOCK · MACAU</div><h3>日出 · 日落</h3></div><RefreshButton onClick={() => query.refetch()} loading={query.isFetching} /></div>
    {sun ? <><div className="sun-arc"><div className="sun-track"><span className="sun-point"><Sun size={16} /></span></div><div className="sun-times"><div><span>日出</span><strong>{sun.sunrise}</strong></div><div><span>日落</span><strong>{sun.sunset}</strong></div></div></div><div className="sun-transit"><Sun size={14} /> 澳門時間</div><SourceLine source="澳門氣象局·日出日落" updatedAt={result?.updatedAt} /></> : <StateMessage text={query.isLoading ? "載入緊…" : "連接唔到"} />}
  </section>;
}

function SettingsPanel({ settings, onSave, onClose }: { settings: Settings; onSave: (settings: Settings) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(settings);
  return <div className="settings-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="settings-panel"><div className="panel-heading"><div><div className="eyebrow">PERSONALIZE</div><h2>首頁設定</h2></div><button className="icon-button" onClick={onClose} aria-label="關閉"><X size={16} /></button></div><div className="setting-block"><label>澳門巴士路線</label><p>只顯示你常用的路線，設定會儲存在這部裝置。</p><div className="route-options">{ROUTE_OPTIONS.map((route) => <button key={route.id} className={`route-option ${draft.routes.includes(route.id) ? "selected" : ""}`} onClick={() => setDraft((current) => ({ ...current, routes: current.routes.includes(route.id) ? current.routes.filter((item) => item !== route.id) : [...current.routes, route.id] }))}>{draft.routes.includes(route.id) && <Check size={14} />}{route.label}</button>)}</div></div><div className="setting-block"><label>資訊密度</label><div className="density-options"><button className={draft.density === "compact" ? "selected" : ""} onClick={() => setDraft({ ...draft, density: "compact" })}>緊湊</button><button className={draft.density === "relaxed" ? "selected" : ""} onClick={() => setDraft({ ...draft, density: "relaxed" })}>舒適</button></div></div><button className="save-button" onClick={() => onSave(draft)}>儲存設定</button></div></div>;
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(() => readSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const saveSettings = (next: Settings) => { const normalized = { ...next, routes: next.routes.length ? next.routes : DEFAULT_SETTINGS.routes }; setSettings(normalized); localStorage.setItem("macau-live-dashboard-settings-v2", JSON.stringify(normalized)); setSettingsOpen(false); };
  const time = clock.toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Macau" });
  return <div className={`dashboard-app ${settings.density === "relaxed" ? "relaxed" : ""}`}>
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}><div className="brand"><div className="brand-mark">MO</div><div><strong>HOME / MO</strong><span>personal dashboard</span></div></div><div className="sidebar-intro"><span>氹仔．澳門</span><p>把澳門每日要看的資訊，放在同一個畫面。</p></div><nav><a href="#weather" onClick={() => setSidebarOpen(false)}><CloudSun size={16} />今日天氣</a><a href="#forecast" onClick={() => setSidebarOpen(false)}><CloudRain size={16} />九日預報</a><a href="#bus" onClick={() => setSidebarOpen(false)}><TrainFront size={16} />澳門巴士</a><a href="#holiday" onClick={() => setSidebarOpen(false)}><CalendarDays size={16} />假期倒數</a></nav><div className="sidebar-bottom"><div className="connection"><span className="live-dot" /> 公開數據串接中</div><a href="#sources" className="sidebar-link"><CircleHelp size={14} />資料來源</a></div></aside>
    {sidebarOpen && <div className="mobile-scrim" onClick={() => setSidebarOpen(false)} />}
    <main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="開啟選單"><Menu size={18} /></button><div className="topbar-copy"><span className="eyebrow">{new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Macau", weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(clock).toUpperCase()}</span><h1>早晨，今日澳門。</h1></div><div className="topbar-actions"><div className="clock-block"><Clock3 size={15} /><strong>{time}</strong><span>{dateLabel()}</span></div><button className="settings-button" onClick={() => setSettingsOpen(true)}><Settings2 size={15} /><span>設定</span></button></div></header><div className="status-strip"><span><span className="live-dot" /> <strong>LIVE DASHBOARD</strong></span><span>所有資料由後端 API 取得 · 自動更新</span><span className="status-note"><Waves size={14} /> MAT / UTC+8</span></div><div className="dashboard-grid"><WeatherCard /><ForecastCard /><BusCard selectedRoutes={settings.routes} /><HolidayCard /><SunCard /></div><footer className="footer" id="sources"><div><strong>MO HOME</strong><span>給澳門日常使用的實時資訊首頁</span></div><div className="footer-links"><a href="https://www.smg.gov.mo/" target="_blank" rel="noreferrer">澳門氣象局 <ExternalLink size={11} /></a><a href="https://www.gov.mo/" target="_blank" rel="noreferrer">Gov.MO <ExternalLink size={11} /></a><a href="https://finance.yahoo.com/" target="_blank" rel="noreferrer">Yahoo Finance <ExternalLink size={11} /></a></div></footer></main>
    {settingsOpen && <SettingsPanel settings={settings} onSave={saveSettings} onClose={() => setSettingsOpen(false)} />}
  </div>;
}
