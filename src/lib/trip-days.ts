import type { Activity, Leg } from "@/lib/trip-data";

export type TripDay = {
  activities: Activity[];
  cityLabel: string;
  date: string;
  leg: Leg;
  legs: Leg[];
};

export function getActiveDay(
  legs: Leg[],
  activities: Activity[],
  now = new Date(),
): TripDay {
  const firstLeg = legs[0];

  if (!firstLeg) {
    throw new Error("No legs found in sheet.");
  }

  const currentDate = getCurrentTripDate(legs, now);
  const currentLeg =
    getLegForDate(legs, currentDate) ??
    (currentDate < firstLeg.arrive ? firstLeg : legs.at(-1) ?? firstLeg);
  const date =
    getTripDates(legs, activities).includes(currentDate)
      ? currentDate
      : currentLeg.arrive;

  return getTripDay(legs, activities, date) ?? buildFallbackDay(currentLeg, date);
}

export function getTripDay(
  legs: Leg[],
  activities: Activity[],
  date: string,
): TripDay | null {
  const dayActivities = activities.filter((activity) => activity.date === date);
  const relevantLegIds = new Set<string>();

  legs.forEach((leg) => {
    if (leg.leave === date || (date >= leg.arrive && date < leg.leave)) {
      relevantLegIds.add(leg.leg_id);
    }
  });
  dayActivities.forEach((activity) => relevantLegIds.add(activity.leg_id));

  const dayLegs = legs.filter((leg) => relevantLegIds.has(leg.leg_id));
  const primaryLeg = getLegForDate(legs, date) ?? dayLegs.at(-1);

  if (!primaryLeg) return null;

  return {
    activities: dayActivities,
    cityLabel: dayLegs.map((leg) => leg.city).join(" / ") || primaryLeg.city,
    date,
    leg: primaryLeg,
    legs: dayLegs.length > 0 ? dayLegs : [primaryLeg],
  };
}

export function getTripDates(legs: Leg[], activities: Activity[] = []): string[] {
  return Array.from(
    new Set([
      ...legs.flatMap((leg) => getDateRange(leg.arrive, leg.leave)),
      ...activities.map((activity) => activity.date),
    ]),
  ).sort();
}

export function getLegForDate(legs: Leg[], date: string): Leg | undefined {
  return legs.find((leg) => date >= leg.arrive && date < leg.leave);
}

function getCurrentTripDate(legs: Leg[], now: Date): string {
  const activeLegDate = legs
    .map((leg) => ({
      date: getDateInTimeZone(now, leg.timezone),
      leg,
    }))
    .find(({ date, leg }) => date >= leg.arrive && date < leg.leave);

  return activeLegDate?.date ?? getDateInTimeZone(now, legs[0]?.timezone ?? "UTC");
}

function getDateInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function buildFallbackDay(leg: Leg, date: string): TripDay {
  return {
    activities: [],
    cityLabel: leg.city,
    date,
    leg,
    legs: [leg],
  };
}

function getDateRange(start: string, endExclusive: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const end = new Date(`${endExclusive}T00:00:00Z`);

  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}
