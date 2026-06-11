import { TripApp } from "@/components/trip-app";
import { getTripData } from "@/lib/trip-data";
import { getActiveDay } from "@/lib/trip-days";
import { getWeatherForecast } from "@/lib/weather";

export default async function Home() {
  const tripData = await getTripData();
  const activeDay = getActiveDay(tripData.legs, tripData.activities);
  const weather = await getWeatherForecast(activeDay.leg, activeDay.date);

  return <TripApp data={tripData} weather={weather} />;
}
