import { router, publicProcedure } from "../_core/trpc";
import { getBusEta, getCurrentWeather, getForecast, getFx, getHolidays, getMarkets, getSun } from "../dashboardData";

export const dashboardRouter = router({
  weather: publicProcedure.query(() => getCurrentWeather()),
  forecast: publicProcedure.query(() => getForecast()),
  fx: publicProcedure.query(() => getFx()),
  bus: publicProcedure.query(() => getBusEta()),
  holidays: publicProcedure.query(() => getHolidays()),
  sun: publicProcedure.query(() => getSun()),
  markets: publicProcedure.query(() => getMarkets()),
});
