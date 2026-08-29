import { router, publicProcedure } from "../_core/trpc";
import { getBusEta, getCurrentWeather, getForecast, getHolidays, getSun } from "../dashboardData";

export const dashboardRouter = router({
  weather: publicProcedure.query(() => getCurrentWeather()),
  forecast: publicProcedure.query(() => getForecast()),
  bus: publicProcedure.query(() => getBusEta()),
  holidays: publicProcedure.query(() => getHolidays()),
  sun: publicProcedure.query(() => getSun()),
});
