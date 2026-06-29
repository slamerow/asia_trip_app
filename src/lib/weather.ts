import type { Leg } from "@/lib/trip-data";

export type WeatherForecast =
  | {
      condition: string;
      date: string;
      high: number;
      location: string;
      low: number;
      outlook: WeatherOutlookDay[];
      rainChance: number | null;
      status: "ready";
    }
  | {
      location: string;
      message: string;
      status: "unavailable";
    };

export type WeatherOutlookDay = {
  condition: string;
  date: string;
  high: number;
  low: number;
  rainChance: number | null;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
  name: string;
};

type GeocodeResponse = {
  results?: GeocodeResult[];
};

type ForecastResponse = {
  daily?: {
    precipitation_probability_max?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    time?: string[];
    weather_code?: Array<number | null>;
  };
};

export async function getWeatherForecast(
  leg: Leg,
  date: string,
): Promise<WeatherForecast> {
  const location = await resolveWeatherLocation(leg);

  if (!location) {
    return {
      location: leg.city,
      message: "Weather unavailable",
      status: "unavailable",
    };
  }

  const params = new URLSearchParams({
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
    ].join(","),
    forecast_days: "16",
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    temperature_unit: "fahrenheit",
    timezone: "auto",
  });
  let forecast: ForecastResponse;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { next: { revalidate: 60 * 60 } },
    );

    if (!response.ok) {
      return {
        location: location.name,
        message: "Weather unavailable",
        status: "unavailable",
      };
    }

    forecast = (await response.json()) as ForecastResponse;
  } catch {
    return {
      location: location.name,
      message: "Weather unavailable",
      status: "unavailable",
    };
  }

  const dateIndex = forecast.daily?.time?.findIndex((item) => item === date) ?? -1;

  if (dateIndex < 0) {
    return {
      location: location.name,
      message: "Available soon",
      status: "unavailable",
    };
  }

  const high = forecast.daily?.temperature_2m_max?.[dateIndex];
  const low = forecast.daily?.temperature_2m_min?.[dateIndex];

  if (typeof high !== "number" || typeof low !== "number") {
    return {
      location: location.name,
      message: "Weather unavailable",
      status: "unavailable",
    };
  }

  return {
    condition: getWeatherCondition(forecast.daily?.weather_code?.[dateIndex] ?? null),
    date,
    high: Math.round(high),
    location: location.name,
    low: Math.round(low),
    outlook: getOutlookDays(forecast, dateIndex),
    rainChance: forecast.daily?.precipitation_probability_max?.[dateIndex] ?? null,
    status: "ready",
  };
}

function getOutlookDays(
  forecast: ForecastResponse,
  startIndex: number,
): WeatherOutlookDay[] {
  const days: WeatherOutlookDay[] = [];

  for (let index = startIndex + 1; index <= startIndex + 2; index += 1) {
    const date = forecast.daily?.time?.[index];
    const high = forecast.daily?.temperature_2m_max?.[index];
    const low = forecast.daily?.temperature_2m_min?.[index];

    if (!date || typeof high !== "number" || typeof low !== "number") continue;

    days.push({
      condition: getWeatherCondition(forecast.daily?.weather_code?.[index] ?? null),
      date,
      high: Math.round(high),
      low: Math.round(low),
      rainChance: forecast.daily?.precipitation_probability_max?.[index] ?? null,
    });
  }

  return days;
}

async function resolveWeatherLocation(leg: Leg): Promise<GeocodeResult | null> {
  if (leg.latitude !== null && leg.longitude !== null) {
    return {
      latitude: leg.latitude,
      longitude: leg.longitude,
      name: leg.stay_name || leg.city,
    };
  }

  for (const query of [cleanCityName(leg.city), `${leg.city}, ${leg.country}`]) {
    const result = await geocodeLocation(query);

    if (result) return result;
  }

  return null;
}

function cleanCityName(city: string): string {
  return city.replace(/\s*\(.+?\)\s*/g, "").trim();
}

async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const cleanQuery = query.trim();

  if (!cleanQuery) return null;

  const params = new URLSearchParams({
    count: "1",
    language: "en",
    name: cleanQuery,
  });
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
      { next: { revalidate: 60 * 60 * 24 } },
    );

    if (!response.ok) return null;

    const geocode = (await response.json()) as GeocodeResponse;
    return geocode.results?.[0] ?? null;
  } catch {
    return null;
  }
}

function getWeatherCondition(code: number | null): string {
  if (code === null) return "Forecast";
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Mostly clear";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";

  return "Forecast";
}
