import { NextResponse } from "next/server";
import { getTripData } from "@/lib/trip-data";
import { getWeatherForecast } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const legId = searchParams.get("leg_id");
  const date = searchParams.get("date");

  if (!legId || !date) {
    return NextResponse.json(
      { message: "Missing leg_id or date." },
      { status: 400 },
    );
  }

  const tripData = await getTripData();
  const leg = tripData.legs.find((item) => item.leg_id === legId);

  if (!leg) {
    return NextResponse.json({ message: "Leg not found." }, { status: 404 });
  }

  const weather = await getWeatherForecast(leg, date);

  return NextResponse.json(weather);
}
