import { afterEach, describe, expect, it, vi } from "vitest";
import { getBusEta, getCurrentWeather, getFx, getHolidays, getSun } from "./dashboardData";

function jsonResponse(body: unknown) { return { ok: true, text: async () => JSON.stringify(body) } as Response; }
function textResponse(body: string) { return { ok: true, text: async () => body } as Response; }
afterEach(() => vi.unstubAllGlobals());

describe("Macau dashboard data adapters", () => {
  it("normalizes SMG current weather XML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(`<ActualWeatherBrief><System><SysPubdate>2026-08-29 17:54</SysPubdate></System><Custom><ValidFor>2026-08-29 18:00</ValidFor><Temperature><Value>29</Value></Temperature><Humidity><Value>81</Value></Humidity><WindSpeed><Value>4</Value></WindSpeed><WindDirection><Value>SW</Value></WindDirection><WeatherStatus>a2</WeatherStatus></Custom></ActualWeatherBrief>`)));
    const result = await getCurrentWeather();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toMatchObject({ place: "澳門", temperature: 29, humidity: 81, wind: "SW 4 km/h" });
  });

  it("formats MOP FX with JPY first and USD second", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ result: "success", base_code: "MOP", time_last_update_utc: "Sat, 29 Aug 2026 00:02:31 +0000", rates: { JPY: 19.792614, USD: 0.123831, EUR: 0.106626, CNY: 0.834912, GBP: 0.091356, SGD: 0.157404 } })));
    const result = await getFx();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.rows.slice(0, 2)).toMatchObject([{ code: "JPY", display: "¥100 = MOP$5.05" }, { code: "USD", display: "MOP$100 → US$12.38" }]);
  });

  it("parses Macau holiday iCal and countdowns the next local date", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261225\nSUMMARY:Christmas Day (Public holiday)\nEND:VEVENT\nEND:VCALENDAR`)));
    const result = await getHolidays();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.next).toMatchObject({ name: "Christmas Day (Public holiday)", date: "2026-12-25" });
  });

  it("maps the six requested Macau bus stop queries and marks estimates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ header: "000", data: { routeInfo: [{ staCode: "T338", busInfo: [] }, { staCode: "T337", busInfo: [{ speed: "12" }] }, { staCode: "M222/2", busInfo: [] }, { staCode: "M16/1", busInfo: [] }] } })));
    const result = await getBusEta();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.routes.map((item) => item.id)).toEqual(["34-T338", "34-M222", "26-T337", "MT2-T337", "MT4-T337", "26-M16"]);
      expect(result.data.routes.every((item) => item.estimate)).toBe(true);
    }
  });

  it("reads Open-Meteo sunrise and sunset fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ daily: { time: ["2026-08-29"], sunrise: ["2026-08-29T06:02"], sunset: ["2026-08-29T18:52"] } })));
    const result = await getSun();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toMatchObject({ sunrise: "06:02", sunset: "18:52" });
  });

  it("returns explicit disconnect state when an upstream feed fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await getCurrentWeather();
    expect(result).toMatchObject({ ok: false, message: "連接唔到", source: "澳門氣象局·即時天氣" });
  });
});
