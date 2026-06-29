import { afterEach, describe, expect, it, vi } from "vitest";
import type { Leg } from "./trip-data";
import { getWeatherForecast } from "./weather";

describe("getWeatherForecast", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an unavailable forecast when the forecast API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));

    const forecast = await getWeatherForecast(makeLeg({ latitude: 47.6062, longitude: -122.3321 }), "2026-06-28");

    expect(forecast).toEqual({
      location: "Test stay",
      message: "Weather unavailable",
      status: "unavailable",
    });
  });

  it("returns an unavailable forecast when geocoding fails for a leg without coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));

    const forecast = await getWeatherForecast(makeLeg({ latitude: null, longitude: null }), "2026-06-28");

    expect(forecast).toEqual({
      location: "Seattle",
      message: "Weather unavailable",
      status: "unavailable",
    });
  });
});

function makeLeg(overrides: Partial<Leg> = {}): Leg {
  return {
    arrive: "2026-06-27",
    arrival_flight: null,
    city: "Seattle",
    country: "USA",
    departure_flight: null,
    language: "English",
    latitude: 47.6062,
    leave: "2026-07-02",
    leg_id: "seattle",
    longitude: -122.3321,
    nights: 5,
    notes: null,
    stay_address: "Seattle",
    stay_name: "Test stay",
    timezone: "America/Los_Angeles",
    why: "Test leg",
    ...overrides,
  };
}
