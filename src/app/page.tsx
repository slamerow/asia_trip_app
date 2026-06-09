import { TripApp } from "@/components/trip-app";
import { getTripData } from "@/lib/trip-data";
import { getWeatherForecast } from "@/lib/weather";

export default async function Home() {
  const tripData = await getTripData();
  const activeDay = getActiveDay(tripData.legs, tripData.activities);
  const weather = await getWeatherForecast(activeDay.leg, activeDay.date);

  return <TripApp data={tripData} weather={weather} />;
}

function getActiveDay(
  legs: Awaited<ReturnType<typeof getTripData>>["legs"],
  activities: Awaited<ReturnType<typeof getTripData>>["activities"],
) {
  const firstLeg = legs[0];

  if (!firstLeg) {
    throw new Error("No legs found in sheet.");
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const currentLeg =
    legs.find((leg) => currentDate >= leg.arrive && currentDate < leg.leave) ??
    (currentDate < firstLeg.arrive ? firstLeg : legs.at(-1) ?? firstLeg);

  const date =
    currentDate >= currentLeg.arrive && currentDate < currentLeg.leave
      ? currentDate
      : currentLeg.arrive;

  return {
    date,
    leg: currentLeg,
    activities: activities.filter(
      (activity) => activity.date === date && activity.leg_id === currentLeg.leg_id,
    ),
  };
}
