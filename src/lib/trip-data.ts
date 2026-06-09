import Papa from "papaparse";

export type Leg = {
  leg_id: string;
  country: string;
  city: string;
  arrive: string;
  leave: string;
  nights: number;
  stay_name: string;
  stay_address: string;
  why: string;
  arrival_flight: string | null;
  departure_flight: string | null;
  notes: string | null;
  timezone: string;
  language: string;
  latitude: number | null;
  longitude: number | null;
};

export type Activity = {
  activity_id: string;
  leg_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  description: string | null;
  category: string;
  location_name: string | null;
  address: string | null;
  url: string | null;
  notes: string | null;
};

export type Category = {
  category_id: string;
  description: string;
  emoji: string;
};

export type Phrase = {
  language: string;
  category: string;
  english: string;
  script: string;
  pronunciation: string;
  verify: string | null;
};

export type TripData = {
  legs: Leg[];
  activities: Activity[];
  categories: Category[];
  phrases: Phrase[];
};

type CsvRow = Record<string, string | undefined>;

const sheetUrls = {
  legs: process.env.SHEET_LEGS_URL,
  activities: process.env.SHEET_ACTIVITIES_URL,
  categories: process.env.SHEET_CATEGORIES_URL,
  phrases: process.env.SHEET_PHRASES_URL,
};

export async function getTripData(): Promise<TripData> {
  const [legs, activities, categories, phrases] = await Promise.all([
    fetchCsv("legs", sheetUrls.legs, normalizeLeg),
    fetchCsv("activities", sheetUrls.activities, normalizeActivity),
    fetchCsv("categories", sheetUrls.categories, normalizeCategory),
    fetchCsv("phrases", sheetUrls.phrases, normalizePhrase),
  ]);

  return { legs, activities, categories, phrases };
}

async function fetchCsv<T>(
  label: keyof typeof sheetUrls,
  url: string | undefined,
  normalize: (row: CsvRow) => T,
): Promise<T[]> {
  if (!url) {
    throw new Error(`Missing ${label} sheet URL environment variable.`);
  }

  const response = await fetch(url, { next: { revalidate: 60 } });

  if (!response.ok) {
    throw new Error(`Could not fetch ${label} sheet: ${response.status}`);
  }

  const csv = await response.text();
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Could not parse ${label} sheet CSV.`);
  }

  return parsed.data.map(normalize);
}

function normalizeLeg(row: CsvRow): Leg {
  return {
    leg_id: required(row, "leg_id"),
    country: required(row, "country"),
    city: required(row, "city"),
    arrive: required(row, "arrive"),
    leave: required(row, "leave"),
    nights: numberOrZero(row.nights),
    stay_name: required(row, "stay_name"),
    stay_address: required(row, "stay_address"),
    why: required(row, "why"),
    arrival_flight: nullable(row.arrival_flight),
    departure_flight: nullable(row.departure_flight),
    notes: nullable(row.notes),
    timezone: required(row, "timezone"),
    language: required(row, "language"),
    latitude: nullableNumber(row.latitude ?? row.lat),
    longitude: nullableNumber(row.longitude ?? row.lng ?? row.lon),
  };
}

function normalizeActivity(row: CsvRow): Activity {
  return {
    activity_id: required(row, "activity_id"),
    leg_id: required(row, "leg_id"),
    date: required(row, "date"),
    start_time: nullable(row.start_time),
    end_time: nullable(row.end_time),
    title: required(row, "title"),
    description: nullable(row.description),
    category: required(row, "category"),
    location_name: nullable(row.location_name),
    address: nullable(row.address),
    url: nullable(row.url),
    notes: nullable(row.notes),
  };
}

function normalizeCategory(row: CsvRow): Category {
  return {
    category_id: required(row, "category_id"),
    description: required(row, "description"),
    emoji: required(row, "emoji"),
  };
}

function normalizePhrase(row: CsvRow): Phrase {
  return {
    language: required(row, "language"),
    category: required(row, "category"),
    english: required(row, "english"),
    script: required(row, "script"),
    pronunciation: required(row, "pronunciation"),
    verify: nullable(row.verify),
  };
}

function required(row: CsvRow, key: string): string {
  const value = row[key]?.trim();

  if (!value) {
    throw new Error(`Missing required sheet column value: ${key}`);
  }

  return value;
}

function nullable(value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

function nullableNumber(value: string | undefined): number | null {
  const cleanValue = nullable(value);

  if (cleanValue === null) return null;

  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrZero(value: string | undefined): number {
  return nullableNumber(value) ?? 0;
}
