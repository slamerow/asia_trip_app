import type { Activity, Leg } from "@/lib/trip-data";
import { getLegForDate } from "@/lib/trip-days";
import type { CalendarSegment, TabId } from "@/components/trip-app/types";

export function getHeaderTitle(activeTab: TabId, leg: Leg): string {
  if (activeTab === "today") return leg.city;
  if (activeTab === "legs") return "Trip Legs";
  if (activeTab === "categories") return "Categories";
  return "Calendar";
}

export function getLegQueueStatus(
  legs: Leg[],
  index: number,
  currentDate: string,
): "current" | "following" | "next" | "quiet" {
  const leg = legs[index];
  if (!leg) return "quiet";

  if (currentDate >= leg.arrive && currentDate < leg.leave) return "current";

  const nextIndex = legs.findIndex((item) => currentDate < item.arrive);
  if (nextIndex < 0) return "quiet";
  if (index === nextIndex) return "next";
  if (index === nextIndex + 1) return "following";

  return "quiet";
}

export function formatTimeRange(activity: Activity): string {
  if (activity.start_time && activity.end_time) {
    return `${activity.start_time} - ${activity.end_time}`;
  }

  return activity.start_time ?? "";
}

export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatLegDayHeader(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDayNumber(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatLegDateRange(leg: Leg): string {
  const arrive = new Date(`${leg.arrive}T00:00:00Z`);
  const leave = new Date(`${leg.leave}T00:00:00Z`);
  const sameYear = arrive.getUTCFullYear() === leave.getUTCFullYear();

  return `${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    year: sameYear ? undefined : "numeric",
  }).format(arrive)} - ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    year: "numeric",
  }).format(leave)}`;
}

export function formatNights(nights: number): string {
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

export function buildCalendarRows(dates: string[], legs: Leg[]): CalendarSegment[][] {
  const rows: CalendarSegment[][] = [];

  for (let rowStart = 0; rowStart < dates.length; rowStart += 7) {
    const weekDates = dates.slice(rowStart, rowStart + 7);
    const row: CalendarSegment[] = [];
    let index = 0;

    while (index < weekDates.length) {
      const date = weekDates[index];
      const leg = getLegForDate(legs, date);
      const previousLeg = getTransitionFromLeg(legs, date, leg);

      if (leg && previousLeg) {
        row.push({
          background: `linear-gradient(to bottom, ${getCountryColor(previousLeg.country).calendar} 0 50%, ${getCountryColor(leg.country).calendar} 50% 100%)`,
          dateLabel: formatDateNumber(date),
          key: `${date}-${previousLeg.leg_id}-${leg.leg_id}`,
          label: `${shortCity(previousLeg.city)} / ${shortCity(leg.city)}`,
          legId: leg.leg_id,
          span: 1,
          startColumn: index + 1,
          title: `${formatLongDate(date)}: ${previousLeg.city} to ${leg.city}`,
          value: date,
        });

        index += 1;
        continue;
      }

      let span = 1;

      while (index + span < weekDates.length) {
        const nextDate = weekDates[index + span];
        const nextLeg = getLegForDate(legs, nextDate);
        const nextPreviousLeg = getTransitionFromLeg(legs, nextDate, nextLeg);

        if (nextPreviousLeg || nextLeg?.leg_id !== leg?.leg_id) break;

        span += 1;
      }

      const segmentDates = weekDates.slice(index, index + span);
      const label = leg ? shortCity(leg.city) : "";

      row.push({
        background: getCountryColor(leg?.country ?? "Trip").calendar,
        dateLabel: formatSegmentDateLabel(segmentDates),
        key: `${segmentDates[0]}-${leg?.leg_id ?? "none"}`,
        label,
        legId: leg?.leg_id ?? null,
        span,
        startColumn: index + 1,
        title: `${formatSegmentTitle(segmentDates)}: ${leg?.city ?? "Trip day"}`,
        value: segmentDates[0],
      });

      index += span;
    }

    rows.push(row);
  }

  return rows;
}

function getTransitionFromLeg(
  legs: Leg[],
  date: string,
  currentLeg: Leg | undefined,
): Leg | undefined {
  const previousLeg = legs.find((leg) => leg.leave === date);

  if (!previousLeg || !currentLeg || previousLeg.leg_id === currentLeg.leg_id) {
    return undefined;
  }

  return previousLeg;
}

export function getCountryColor(country: string): {
  accent: string;
  calendar: string;
  card: string;
  text: string;
} {
  const colors = [
    {
      accent: "rgb(37 95 101)",
      calendar: "rgba(37, 95, 101, 0.24)",
      card: "rgb(37 95 101 / 0.22)",
      text: "rgb(25 76 82)",
    },
    {
      accent: "rgb(157 96 28)",
      calendar: "rgba(157, 96, 28, 0.24)",
      card: "rgb(157 96 28 / 0.22)",
      text: "rgb(118 68 16)",
    },
    {
      accent: "rgb(39 89 56)",
      calendar: "rgba(39, 89, 56, 0.24)",
      card: "rgb(39 89 56 / 0.22)",
      text: "rgb(24 64 38)",
    },
    {
      accent: "rgb(125 74 112)",
      calendar: "rgba(125, 74, 112, 0.23)",
      card: "rgb(125 74 112 / 0.2)",
      text: "rgb(94 50 83)",
    },
    {
      accent: "rgb(121 89 32)",
      calendar: "rgba(121, 89, 32, 0.24)",
      card: "rgb(121 89 32 / 0.22)",
      text: "rgb(90 63 19)",
    },
    {
      accent: "rgb(76 98 57)",
      calendar: "rgba(76, 98, 57, 0.24)",
      card: "rgb(76 98 57 / 0.22)",
      text: "rgb(50 71 35)",
    },
  ];
  const normalizedCountry = country.trim().toLowerCase();
  const countryColorIndex: Record<string, number> = {
    us: 0,
    japan: 1,
    korea: 2,
    taiwan: 3,
    thailand: 4,
    laos: 5,
    vietnam: 0,
    cambodia: 1,
    singapore: 2,
    indonesia: 3,
    "sri lanka": 4,
    maldives: 5,
  };
  const assignedIndex = countryColorIndex[normalizedCountry];

  if (assignedIndex !== undefined) return colors[assignedIndex];

  const hash = Array.from(normalizedCountry).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return colors[hash % colors.length];
}

function shortCity(city: string): string {
  return city.replace(/\s*\(.+?\)\s*/g, "").trim();
}

function formatDateNumber(date: string): string {
  return String(Number(date.slice(-2)));
}

function formatSegmentDateLabel(dates: string[]): string {
  if (dates.length === 1) return formatDateNumber(dates[0]);

  return `${formatDateNumber(dates[0])}-${formatDateNumber(dates.at(-1) ?? dates[0])}`;
}

function formatSegmentTitle(dates: string[]): string {
  if (dates.length === 1) return formatLongDate(dates[0]);

  return `${formatLongDate(dates[0])} - ${formatLongDate(dates.at(-1) ?? dates[0])}`;
}

export function isEnglishLanguage(language: string): boolean {
  return ["english", "en"].includes(language.trim().toLowerCase());
}

export function isMapTransitStop(leg: Leg): boolean {
  const values = [leg.leg_id, leg.city, leg.stay_name]
    .filter(Boolean)
    .map((value) => value.trim().toLowerCase());

  return values.some(
    (value) => value === "cts" || value.startsWith("cts-") || value.includes("sapporo"),
  );
}

export function getGoogleMapsUrl(leg: Leg): string {
  if (leg.latitude !== null && leg.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${leg.latitude},${leg.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${leg.stay_address || leg.city}, ${leg.country}`,
  )}`;
}

export function getStayGoogleMapsUrl(leg: Leg): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    leg.stay_address || `${leg.stay_name}, ${leg.city}, ${leg.country}`,
  )}`;
}

export function groupActivitiesByDate(
  activities: Activity[],
): Array<{ activities: Activity[]; date: string }> {
  const groups = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    groups.set(activity.date, [...(groups.get(activity.date) ?? []), activity]);
  });

  return Array.from(groups.entries()).map(([date, groupedActivities]) => ({
    activities: groupedActivities,
    date,
  }));
}
