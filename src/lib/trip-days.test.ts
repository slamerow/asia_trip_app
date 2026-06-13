import { describe, expect, it } from "vitest";
import type { Activity, Leg } from "./trip-data";
import { getLegForDate, getTripDates, getTripDay } from "./trip-days";

const legs: Leg[] = [
  makeLeg({ arrive: "2026-07-10", city: "Seattle", leave: "2026-07-12", leg_id: "sea" }),
  makeLeg({ arrive: "2026-07-12", city: "Maui (Kihei)", leave: "2026-07-15", leg_id: "maui" }),
];

const activities: Activity[] = [
  makeActivity({ activity_id: "flight", date: "2026-07-12", leg_id: "sea", title: "Fly to Maui" }),
  makeActivity({ activity_id: "dinner", date: "2026-07-12", leg_id: "maui", title: "Dinner in Kihei" }),
];

describe("getTripDay", () => {
  it("keeps every activity and both locations on a split travel day", () => {
    const day = getTripDay(legs, activities, "2026-07-12");

    expect(day).not.toBeNull();
    expect(day?.cityLabel).toBe("Seattle / Maui (Kihei)");
    expect(day?.legs.map((leg) => leg.leg_id)).toEqual(["sea", "maui"]);
    expect(day?.activities.map((activity) => activity.activity_id)).toEqual(["flight", "dinner"]);
    expect(day?.leg.leg_id).toBe("maui");
  });

  it("returns null for a date with no leg or activity", () => {
    expect(getTripDay(legs, activities, "2026-08-01")).toBeNull();
  });
});

describe("trip date boundaries", () => {
  it("treats a leg's leave date as exclusive", () => {
    expect(getLegForDate(legs, "2026-07-11")?.leg_id).toBe("sea");
    expect(getLegForDate(legs, "2026-07-12")?.leg_id).toBe("maui");
  });

  it("returns sorted unique dates from legs and activities", () => {
    const dates = getTripDates(legs, [
      ...activities,
      makeActivity({ activity_id: "extra", date: "2026-07-16", leg_id: "maui", title: "Extra day" }),
    ]);

    expect(dates).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
      "2026-07-16",
    ]);
  });
});

function makeLeg(overrides: Partial<Leg> & Pick<Leg, "arrive" | "city" | "leave" | "leg_id">): Leg {
  return {
    arrival_flight: null,
    country: "USA",
    departure_flight: null,
    language: "English",
    latitude: null,
    longitude: null,
    nights: 2,
    notes: null,
    stay_address: "Test address",
    stay_name: "Test stay",
    timezone: "America/Los_Angeles",
    why: "Test leg",
    ...overrides,
  };
}

function makeActivity(
  overrides: Partial<Activity> & Pick<Activity, "activity_id" | "date" | "leg_id" | "title">,
): Activity {
  return {
    address: null,
    category: "travel",
    description: null,
    end_time: null,
    location_name: null,
    notes: null,
    start_time: null,
    url: null,
    ...overrides,
  };
}
