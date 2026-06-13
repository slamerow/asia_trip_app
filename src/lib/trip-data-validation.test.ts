import { describe, expect, it } from "vitest";
import type { Activity, Category, Leg, TripData } from "./trip-data";
import {
  normalizeTripData,
  TripDataValidationError,
  validateTripData,
} from "./trip-data-validation";

describe("validateTripData", () => {
  it("accepts a connected trip dataset", () => {
    const data = makeTripData();

    expect(validateTripData(data)).toBe(data);
  });

  it("normalizes a human-readable category description to its stable ID", () => {
    const data = makeTripData();
    data.activities[0] = { ...data.activities[0], category: "Food and drink" };

    const normalized = normalizeTripData(data);

    expect(normalized.activities[0]?.category).toBe("food");
    expect(validateTripData(normalized)).toBe(normalized);
  });

  it("reports duplicate IDs and broken references together", () => {
    const data = makeTripData();
    data.legs.push({ ...data.legs[0] });
    data.activities[0] = {
      ...data.activities[0],
      category: "missing-category",
      leg_id: "missing-leg",
    };

    expectValidationIssues(data, [
      "Duplicate leg ID: tokyo.",
      "Activity dinner references missing leg missing-leg.",
      "Activity dinner references missing category missing-category.",
    ]);
  });

  it("rejects impossible and malformed dates", () => {
    const data = makeTripData();
    data.legs[0] = { ...data.legs[0], arrive: "2026-07-20", leave: "2026-07-19" };
    data.activities[0] = { ...data.activities[0], date: "2026-02-30" };

    expectValidationIssues(data, [
      "Leg tokyo must leave after it arrives.",
      "Activity dinner has an invalid date: 2026-02-30.",
    ]);
  });

  it("rejects out-of-range coordinates", () => {
    const data = makeTripData();
    data.legs[0] = { ...data.legs[0], latitude: 95, longitude: -181 };

    expectValidationIssues(data, [
      "Leg tokyo has an invalid latitude.",
      "Leg tokyo has an invalid longitude.",
    ]);
  });
});

function expectValidationIssues(data: TripData, expected: string[]) {
  try {
    validateTripData(data);
    throw new Error("Expected trip data validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(TripDataValidationError);
    expect((error as TripDataValidationError).issues).toEqual(expect.arrayContaining(expected));
  }
}

function makeTripData(): TripData {
  const leg: Leg = {
    arrive: "2026-07-18",
    arrival_flight: null,
    city: "Tokyo",
    country: "Japan",
    departure_flight: null,
    language: "Japanese",
    latitude: 35.6762,
    leave: "2026-07-21",
    leg_id: "tokyo",
    longitude: 139.6503,
    nights: 3,
    notes: null,
    stay_address: "Tokyo",
    stay_name: "Test stay",
    timezone: "Asia/Tokyo",
    why: "Test leg",
  };
  const activity: Activity = {
    activity_id: "dinner",
    address: null,
    category: "food",
    date: "2026-07-18",
    description: null,
    end_time: null,
    leg_id: "tokyo",
    location_name: null,
    notes: null,
    start_time: null,
    title: "Dinner",
    url: null,
  };
  const category: Category = {
    category_id: "food",
    description: "Food and drink",
    emoji: "food",
  };

  return { activities: [activity], categories: [category], legs: [leg], phrases: [] };
}
