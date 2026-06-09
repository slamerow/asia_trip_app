import { TripApp } from "@/components/trip-app";
import { getTripData } from "@/lib/trip-data";

export default async function Home() {
  const tripData = await getTripData();

  return <TripApp data={tripData} />;
}
