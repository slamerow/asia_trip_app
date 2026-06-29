import type { TripData } from "@/lib/trip-data";

export class TripDataValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Trip data is invalid:\n- ${issues.join("\n- ")}`);
    this.name = "TripDataValidationError";
    this.issues = issues;
  }
}

export function normalizeTripData(data: TripData): TripData {
  const categoryIds = new Set(data.categories.map((category) => category.category_id));
  const categoryIdByDescription = new Map(
    data.categories.map((category) => [category.description.toLowerCase(), category.category_id]),
  );

  return {
    ...data,
    activities: data.activities.map((activity) => {
      if (categoryIds.has(activity.category)) return activity;

      const categoryId = categoryIdByDescription.get(activity.category.toLowerCase());
      return categoryId ? { ...activity, category: categoryId } : activity;
    }),
  };
}

export function validateTripData(data: TripData): TripData {
  const issues: string[] = [];
  const legIds = collectUniqueIds(data.legs, (leg) => leg.leg_id, "leg", issues);
  collectUniqueIds(
    data.activities,
    (activity) => activity.activity_id,
    "activity",
    issues,
  );
  const categoryIds = collectUniqueIds(
    data.categories,
    (category) => category.category_id,
    "category",
    issues,
  );

  if (data.legs.length === 0) issues.push("At least one leg is required.");
  if (data.categories.length === 0) issues.push("At least one category is required.");

  data.legs.forEach((leg) => {
    if (!isIsoDate(leg.arrive)) issues.push(`Leg ${leg.leg_id} has an invalid arrive date: ${leg.arrive}.`);
    if (!isIsoDate(leg.leave)) issues.push(`Leg ${leg.leg_id} has an invalid leave date: ${leg.leave}.`);
    if (isIsoDate(leg.arrive) && isIsoDate(leg.leave) && leg.arrive >= leg.leave) {
      issues.push(`Leg ${leg.leg_id} must leave after it arrives.`);
    }
    if (!Number.isFinite(leg.nights) || leg.nights < 0) {
      issues.push(`Leg ${leg.leg_id} has an invalid nights value.`);
    }
    if (leg.latitude !== null && (leg.latitude < -90 || leg.latitude > 90)) {
      issues.push(`Leg ${leg.leg_id} has an invalid latitude.`);
    }
    if (leg.longitude !== null && (leg.longitude < -180 || leg.longitude > 180)) {
      issues.push(`Leg ${leg.leg_id} has an invalid longitude.`);
    }
    if (!isValidTimeZone(leg.timezone)) {
      issues.push(`Leg ${leg.leg_id} has an invalid timezone: ${leg.timezone}.`);
    }
  });

  data.activities.forEach((activity) => {
    if (!legIds.has(activity.leg_id)) {
      issues.push(`Activity ${activity.activity_id} references missing leg ${activity.leg_id}.`);
    }
    if (!categoryIds.has(activity.category)) {
      issues.push(`Activity ${activity.activity_id} references missing category ${activity.category}.`);
    }
    if (!isIsoDate(activity.date)) {
      issues.push(`Activity ${activity.activity_id} has an invalid date: ${activity.date}.`);
    }
    if (activity.url && !isHttpUrl(activity.url)) {
      issues.push(`Activity ${activity.activity_id} has an invalid URL: ${activity.url}.`);
    }
  });

  if (issues.length > 0) throw new TripDataValidationError(issues);
  return data;
}

function collectUniqueIds<T>(
  items: T[],
  getId: (item: T) => string,
  label: string,
  issues: string[],
): Set<string> {
  const ids = new Set<string>();

  items.forEach((item) => {
    const id = getId(item);
    if (ids.has(id)) issues.push(`Duplicate ${label} ID: ${id}.`);
    ids.add(id);
  });

  return ids;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
