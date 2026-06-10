"use client";

import type { Activity, Category, Leg, Phrase, TripData } from "@/lib/trip-data";
import type { WeatherForecast } from "@/lib/weather";
import { TripMap } from "@/components/trip-map";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudSun,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Languages,
  MapPinned,
  Search,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type TabId = "legs" | "categories" | "today" | "calendar";
type CalendarSegment = {
  background: string;
  dateLabel: string;
  key: string;
  label: string;
  legId: string | null;
  span: number;
  startColumn: number;
  title: string;
  value: string;
};

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "legs", label: "Legs", icon: MapPinned },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "today", label: "Today", icon: Sparkles },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function TripApp({
  data,
  weather,
}: {
  data: TripData;
  weather: WeatherForecast;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<Leg | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStayOpen, setIsStayOpen] = useState(false);

  const categoryById = useMemo(
    () => new Map(data.categories.map((category) => [category.category_id, category])),
    [data.categories],
  );

  const defaultDay = useMemo(() => getActiveDay(data.legs, data.activities), [data]);
  const tripDates = useMemo(() => getTripDates(data.legs), [data.legs]);
  const [todayDate, setTodayDate] = useState(defaultDay.date);
  const activeDay = useMemo(
    () => getTripDay(data.legs, data.activities, todayDate) ?? defaultDay,
    [data.activities, data.legs, defaultDay, todayDate],
  );
  const [fetchedWeather, setFetchedWeather] = useState<{
    key: string;
    weather: WeatherForecast;
  } | null>(null);
  const title = getHeaderTitle(activeTab, activeDay.leg);
  const weatherKey = `${activeDay.leg.leg_id}:${activeDay.date}`;
  const selectedWeather =
    activeDay.date === defaultDay.date
      ? weather
      : fetchedWeather?.key === weatherKey
        ? fetchedWeather.weather
        : {
            location: activeDay.leg.city,
            message: "Available soon",
            status: "unavailable",
          } satisfies WeatherForecast;
  const isWeatherLoading =
    activeDay.date !== defaultDay.date && fetchedWeather?.key !== weatherKey;

  useEffect(() => {
    let isMounted = true;

    if (activeDay.date === defaultDay.date) {
      return;
    }

    fetch(
      `/api/weather?leg_id=${encodeURIComponent(activeDay.leg.leg_id)}&date=${activeDay.date}`,
    )
      .then((response) => {
        if (!response.ok) throw new Error("Weather request failed.");
        return response.json() as Promise<WeatherForecast>;
      })
      .then((forecast) => {
        if (isMounted) setFetchedWeather({ key: weatherKey, weather: forecast });
      })
      .catch(() => {
        if (isMounted) {
          setFetchedWeather({
            key: weatherKey,
            weather: {
              location: activeDay.leg.city,
              message: "Weather unavailable",
              status: "unavailable",
            },
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeDay.date, activeDay.leg.city, activeDay.leg.leg_id, defaultDay.date, weatherKey]);

  return (
    <main className="journal-page min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <div className="journal-app mx-auto flex min-h-screen w-full max-w-[440px] flex-col border-x border-black/10 bg-[var(--color-app)] shadow-2xl shadow-stone-950/25">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-app)]/95 px-5 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            {activeTab === "today" ? (
              <MiniWeatherSummary
                isLoading={isWeatherLoading}
                weather={selectedWeather}
              />
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-muted)]">
                  {formatLongDate(activeDay.date)}
                </p>
                <h1 className="mt-1 truncate text-4xl font-semibold tracking-normal">
                  {title}
                </h1>
              </div>
            )}
            <div className="flex shrink-0 gap-2">
              <IconButton label="Stay" onClick={() => setIsStayOpen(true)}>
                <MapPin size={19} />
              </IconButton>
              <IconButton label="Search" onClick={() => setIsSearchOpen(true)}>
                <Search size={19} />
              </IconButton>
              <IconButton label="Map" onClick={() => setIsMapOpen(true)}>
                <MapIcon size={19} />
              </IconButton>
              <IconButton label="Phrases" onClick={() => setIsPhrasebookOpen(true)}>
                <Languages size={19} />
              </IconButton>
            </div>
          </div>
        </header>

        <section className="flex-1 px-5 pb-28 pt-5">
          {activeTab === "today" && (
            <TodayPanel
              activities={activeDay.activities}
              activeDate={activeDay.date}
              categoryById={categoryById}
              defaultDate={defaultDay.date}
              leg={activeDay.leg}
              onSelectActivity={setSelectedActivity}
              onSelectDate={setTodayDate}
              tripDates={tripDates}
            />
          )}
          {activeTab === "legs" && (
            <LegsPanel legs={data.legs} onSelectLeg={setSelectedLeg} />
          )}
          {activeTab === "categories" && (
            <CategoriesPanel
              categories={data.categories}
              activities={data.activities}
              onSelectCategory={setSelectedCategory}
            />
          )}
          {activeTab === "calendar" && (
            <CalendarPanel
              activities={data.activities}
              legs={data.legs}
              onSelectDate={(date) => {
                setTodayDate(date);
                setActiveTab("today");
              }}
              onSelectLeg={setSelectedLeg}
            />
          )}
        </section>

        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[440px] -translate-x-1/2 border-t border-[var(--color-border)] bg-[var(--color-app)]/96 px-3 pb-3 pt-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[var(--color-green)] text-white shadow-lg shadow-emerald-950/25"
                      : "text-[var(--color-muted)] hover:bg-white/70"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} strokeWidth={2.2} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <AnimatePresence>
          {selectedActivity && (
            <ActivityDetail
              activity={selectedActivity}
              category={categoryById.get(selectedActivity.category)}
              leg={data.legs.find((leg) => leg.leg_id === selectedActivity.leg_id)}
              onClose={() => setSelectedActivity(null)}
            />
          )}
          {selectedLeg && (
            <LegDetail
              activities={data.activities.filter((activity) => activity.leg_id === selectedLeg.leg_id)}
              leg={selectedLeg}
              onClose={() => setSelectedLeg(null)}
              onSelectActivity={(activity) => {
                setSelectedLeg(null);
                setSelectedActivity(activity);
              }}
            />
          )}
          {selectedCategory && (
            <CategoryDetail
              activities={data.activities.filter(
                (activity) => activity.category === selectedCategory.category_id,
              )}
              category={selectedCategory}
              legs={data.legs}
              onClose={() => setSelectedCategory(null)}
              onSelectActivity={(activity) => {
                setSelectedCategory(null);
                setSelectedActivity(activity);
              }}
            />
          )}
          {isSearchOpen && (
            <SearchDetail
              activities={data.activities}
              categoryById={categoryById}
              legs={data.legs}
              onClose={() => setIsSearchOpen(false)}
              onSelectActivity={(activity) => {
                setIsSearchOpen(false);
                setSelectedActivity(activity);
              }}
            />
          )}
          {isMapOpen && (
            <MapDetail legs={data.legs} onClose={() => setIsMapOpen(false)} />
          )}
          {isStayOpen && (
            <StayDetail leg={activeDay.leg} onClose={() => setIsStayOpen(false)} />
          )}
          {isPhrasebookOpen && (
            <PhrasebookDetail
              activeLanguage={activeDay.leg.language}
              phrases={data.phrases}
              onClose={() => setIsPhrasebookOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function TodayPanel({
  activities,
  activeDate,
  categoryById,
  defaultDate,
  leg,
  onSelectActivity,
  onSelectDate,
  tripDates,
}: {
  activities: Activity[];
  activeDate: string;
  categoryById: Map<string, Category>;
  defaultDate: string;
  leg: Leg;
  onSelectActivity: (activity: Activity) => void;
  onSelectDate: (date: string) => void;
  tripDates: string[];
}) {
  const activeIndex = tripDates.indexOf(activeDate);
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < tripDates.length - 1;
  const isDefaultDate = activeDate === defaultDate;

  const moveDay = (direction: -1 | 1) => {
    const nextDate = tripDates[activeIndex + direction];

    if (nextDate) onSelectDate(nextDate);
  };

  return (
    <div className="flex min-h-[calc(100dvh-15rem)] flex-col">
      <div className="rounded-xl border border-[var(--color-border)]/55 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Previous day"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/65 bg-[var(--color-app)]/70 text-[var(--color-ink)] shadow-sm disabled:opacity-35"
            disabled={!canGoPrevious}
            onClick={() => moveDay(-1)}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              {formatLongDate(activeDate)}
            </p>
            <h2 className="mt-1 truncate text-4xl font-semibold leading-tight">
              {leg.city}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Next day"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/65 bg-[var(--color-app)]/70 text-[var(--color-ink)] shadow-sm disabled:opacity-35"
            disabled={!canGoNext}
            onClick={() => moveDay(1)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
        {!isDefaultDate && (
          <button
            type="button"
            className="mx-auto mt-3 block rounded-full bg-[var(--color-green)] px-3 py-1 text-xs font-bold uppercase text-white shadow-sm"
            onClick={() => onSelectDate(defaultDate)}
          >
            Back to today
          </button>
        )}
      </div>

      <div className="-mx-5 flex flex-1 items-center">
        <div className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth pb-5 pt-6">
          <div className="shrink-0 basis-[11%]" aria-hidden="true" />
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityCard
                key={activity.activity_id}
                activity={activity}
                category={categoryById.get(activity.category)}
                onSelect={() => onSelectActivity(activity)}
              />
            ))
          ) : (
            <RestDayCard date={activeDate} />
          )}
          <div className="shrink-0 basis-[11%]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function MiniWeatherSummary({
  isLoading = false,
  weather,
}: {
  isLoading?: boolean;
  weather: WeatherForecast;
}) {
  const label =
    weather.status === "ready"
      ? `${weather.high}° / ${weather.low}°`
      : "-- / --";
  const detail =
    isLoading
      ? "Updating"
      : weather.status === "ready"
        ? weather.condition
        : weather.message === "Available soon"
          ? "Forecast soon"
          : weather.message;

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/65 bg-[var(--color-sky)] px-2.5 py-2 shadow-sm">
      <CloudSun className="shrink-0 text-[var(--color-blue)]" size={22} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase leading-none text-[var(--color-muted)]">
          Weather
        </p>
        <p className="mt-1 whitespace-nowrap text-sm font-bold leading-none">{label}</p>
        <p className="mt-1 max-w-28 truncate text-[11px] font-semibold leading-none text-[var(--color-blue)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function StayDetail({ leg, onClose }: { leg: Leg; onClose: () => void }) {
  return (
    <Overlay onClose={onClose} closeLabel="Close stay">
      <p className="text-sm font-semibold text-[var(--color-muted)]">Stay</p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">
        {leg.stay_name}
      </h2>
      <p className="mt-2 text-lg font-semibold text-[var(--color-leather)]">
        {leg.city}, {leg.country}
      </p>

      <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
          <MapPin size={16} />
          Address
        </p>
        <p className="mt-4 whitespace-pre-line text-2xl font-semibold leading-snug">
          {leg.stay_address}
        </p>
      </div>

      <a
        className="mt-5 flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-green)] px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/20"
        href={getStayGoogleMapsUrl(leg)}
        rel="noreferrer"
        target="_blank"
      >
        Open in Google Maps
        <ExternalLink size={16} />
      </a>
    </Overlay>
  );
}

function ActivityCard({
  activity,
  category,
  onSelect,
}: {
  activity: Activity;
  category: Category | undefined;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="mx-2 flex h-[235px] shrink-0 basis-[78%] snap-center flex-col items-center justify-center rounded-xl border border-white/70 bg-[var(--color-surface)] p-5 text-center shadow-[var(--shadow-card)] outline outline-1 outline-black/5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
      onClick={onSelect}
    >
      {activity.start_time ? (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-muted)]">
          <Clock size={16} />
          <span>{formatTimeRange(activity)}</span>
        </div>
      ) : (
        <div className="text-sm font-medium text-[var(--color-muted)]">
          Anytime
        </div>
      )}
      <div className="mt-5">
        <h2 className="line-clamp-4 text-3xl font-semibold leading-tight">
          {activity.title}
        </h2>
      </div>
      <p className="mt-6 text-3xl leading-none">{category?.emoji ?? "•"}</p>
    </button>
  );
}

function RestDayCard({ date }: { date: string }) {
  return (
    <article className="mx-2 flex h-[220px] shrink-0 basis-[78%] snap-center flex-col justify-between rounded-xl border border-white/70 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm font-medium text-[var(--color-muted)]">
        {formatLongDate(date)}
      </p>
      <div>
        <h2 className="text-3xl font-semibold leading-tight">Rest Day</h2>
        <p className="mt-3 text-base leading-6 text-[var(--color-muted)]">
          No sheet rows for this date yet.
        </p>
      </div>
      <p className="text-3xl leading-none">🌿</p>
    </article>
  );
}

function LegsPanel({
  legs,
  onSelectLeg,
}: {
  legs: Leg[];
  onSelectLeg: (leg: Leg) => void;
}) {
  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {legs.map((leg, index) => {
        const status = getLegQueueStatus(legs, index, currentDate);

        return (
          <button
            key={leg.leg_id}
            type="button"
            className={`relative flex w-full items-center justify-between overflow-hidden rounded-xl border p-4 pl-5 text-left shadow-[var(--shadow-card)] outline outline-1 outline-black/5 transition hover:-translate-y-0.5 ${
              status === "current"
                ? "border-[var(--color-green)] bg-[var(--color-sky)]"
                : status === "next"
                  ? "border-[var(--color-border)] bg-[var(--color-surface)]"
                  : "border-white/60 bg-[var(--color-surface)]"
            }`}
            onClick={() => onSelectLeg(leg)}
          >
            {status !== "quiet" && (
              <span
                className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${
                  status === "current"
                    ? "bg-[var(--color-green)]"
                    : status === "next"
                      ? "bg-[var(--color-brass)]"
                      : "bg-[var(--color-muted)]/45"
                }`}
                aria-hidden="true"
              />
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-lg font-semibold">{leg.city}</span>
              </span>
              <span className="mt-1 block text-sm text-[var(--color-muted)]">
                {formatShortDate(leg.arrive)} - {formatShortDate(leg.leave)} ·{" "}
                {leg.country} · {formatNights(leg.nights)}
              </span>
              <span className="mt-1 block truncate text-sm text-[var(--color-muted)]">
                {leg.stay_name}
              </span>
            </span>
            <ChevronRight className="ml-3 shrink-0 text-[var(--color-muted)]" size={20} />
          </button>
        );
      })}
    </div>
  );
}

function CategoriesPanel({
  activities,
  categories,
  onSelectCategory,
}: {
  activities: Activity[];
  categories: Category[];
  onSelectCategory: (category: Category) => void;
}) {
  const counts = useMemo(() => {
    const nextCounts = new Map<string, number>();

    activities.forEach((activity) => {
      nextCounts.set(activity.category, (nextCounts.get(activity.category) ?? 0) + 1);
    });

    return nextCounts;
  }, [activities]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <button
          key={category.category_id}
          type="button"
          className="min-h-[170px] rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)] outline outline-1 outline-black/5"
          onClick={() => onSelectCategory(category)}
        >
          <span className="block text-4xl">{category.emoji}</span>
          <span className="mt-4 block text-base font-semibold leading-snug">
            {category.description}
          </span>
          <span className="mt-2 block text-sm text-[var(--color-muted)]">
            {counts.get(category.category_id) ?? 0} activities
          </span>
        </button>
      ))}
    </div>
  );
}

function CalendarPanel({
  activities,
  legs,
  onSelectDate,
  onSelectLeg,
}: {
  activities: Activity[];
  legs: Leg[];
  onSelectDate: (date: string) => void;
  onSelectLeg: (leg: Leg) => void;
}) {
  const tripDates = useMemo(() => {
    const start = legs[0]?.arrive;
    const end = legs.at(-1)?.leave;

    if (!start || !end) return [];

    return getDateRange(start, end);
  }, [legs]);
  const months = useMemo(() => Array.from(new Set(tripDates.map((date) => date.slice(0, 7)))), [tripDates]);
  const [monthIndex, setMonthIndex] = useState(0);
  const activeMonth = months[monthIndex] ?? tripDates[0]?.slice(0, 7);
  const visibleDates = useMemo(
    () => tripDates.filter((date) => date.startsWith(activeMonth ?? "")),
    [activeMonth, tripDates],
  );
  const calendarRows = useMemo(
    () => buildCalendarRows(visibleDates, legs),
    [visibleDates, legs],
  );
  const activityCounts = useMemo(() => {
    const counts = new Map<string, number>();

    activities.forEach((activity) => {
      counts.set(activity.date, (counts.get(activity.date) ?? 0) + 1);
    });

    return counts;
  }, [activities]);

  return (
    <div>
      <div className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/45 text-[var(--color-ink)] disabled:opacity-35"
            disabled={monthIndex === 0}
            onClick={() => setMonthIndex((index) => Math.max(0, index - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-lg font-semibold">
            {activeMonth ? formatMonth(activeMonth) : "Calendar"}
          </p>
          <button
            type="button"
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/45 text-[var(--color-ink)] disabled:opacity-35"
            disabled={monthIndex >= months.length - 1}
            onClick={() => setMonthIndex((index) => Math.min(months.length - 1, index + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <label className="block">
            <span className="sr-only">Choose month</span>
            <select
              className="h-11 w-full rounded-lg border border-white/60 bg-[var(--color-app)] px-3 text-sm font-semibold text-[var(--color-ink)] shadow-sm outline-none"
              value={activeMonth ?? ""}
              onChange={(event) => {
                const nextIndex = months.indexOf(event.target.value);

                if (nextIndex >= 0) setMonthIndex(nextIndex);
              }}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Choose day</span>
            <select
              className="h-11 w-full rounded-lg border border-white/60 bg-[var(--color-app)] px-3 text-sm font-semibold text-[var(--color-ink)] shadow-sm outline-none"
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;

                onSelectDate(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Day</option>
              {visibleDates.map((date) => {
                const leg = getLegForDate(legs, date);
                const count = activityCounts.get(date) ?? 0;

                return (
                  <option key={date} value={date}>
                    {formatDayNumber(date)} · {leg?.city ?? "Trip"} · {count}{" "}
                    {count === 1 ? "plan" : "plans"}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="mt-3 space-y-1.5">
          {calendarRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 gap-1">
              {row.map((segment) => (
                <button
                  key={segment.key}
                  type="button"
                  title={segment.title}
                  className="flex min-h-[62px] flex-col justify-between rounded-md border border-white/45 px-2 py-1.5 text-left text-[var(--color-ink)] shadow-sm"
                  style={{
                    background: segment.background,
                    gridColumn: `${segment.startColumn} / span ${segment.span}`,
                  }}
                  onClick={() => {
                    const leg = legs.find((item) => item.leg_id === segment.legId);
                    if (leg) onSelectLeg(leg);
                  }}
                >
                  <span className="text-[10px] font-semibold leading-none text-[var(--color-muted)]">
                    {segment.dateLabel}
                  </span>
                  {segment.label && (
                    <span className="line-clamp-2 break-words text-[10px] font-bold leading-tight sm:text-[11px]">
                      {segment.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm shadow-stone-950/10"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ActivityDetail({
  activity,
  category,
  leg,
  onClose,
}: {
  activity: Activity;
  category: Category | undefined;
  leg: Leg | undefined;
  onClose: () => void;
}) {
  const touchStartY = useRef<number | null>(null);
  const touchStartScrollTop = useRef(0);

  return (
    <motion.div
      className="fixed inset-0 z-30 bg-stone-950/35 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="mx-auto flex max-h-dvh min-h-dvh w-full max-w-[440px] flex-col overflow-y-auto overscroll-contain bg-[var(--color-app)] px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-2xl"
        initial={{ borderRadius: 22, opacity: 0.96, scale: 0.94, y: 80 }}
        animate={{ borderRadius: 0, opacity: 1, scale: 1, y: 0 }}
        onTouchEnd={(event) => {
          const startY = touchStartY.current;
          const touch = event.changedTouches[0];

          if (
            startY !== null &&
            touch &&
            touch.clientY - startY > 68 &&
            touchStartScrollTop.current < 8
          ) {
            onClose();
          }

          touchStartY.current = null;
        }}
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0]?.clientY ?? null;
          touchStartScrollTop.current = event.currentTarget.scrollTop;
        }}
        exit={{ borderRadius: 22, opacity: 0, scale: 0.96, y: 60 }}
        transition={{ damping: 28, stiffness: 260, type: "spring" }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Close activity"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] shadow-sm"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6">
          <p className="inline-flex items-center rounded-full bg-[var(--color-green)] px-3 py-1 text-sm font-semibold text-white shadow-sm">
            <span className="mr-2">{category?.emoji ?? "•"}</span>
            {category?.description ?? activity.category}
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight">
            {activity.title}
          </h2>
          {activity.start_time && (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
              <Clock size={16} />
              {formatTimeRange(activity)}
            </p>
          )}
          {activity.description && (
            <p className="mt-6 whitespace-pre-line text-base leading-7 text-[var(--color-ink)]">
              {activity.description}
            </p>
          )}
          {(activity.location_name || activity.address || leg) && (
            <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
                <MapPin size={16} />
                Location
              </p>
              <p className="mt-2 font-semibold">
                {activity.location_name ?? leg?.city}
              </p>
              {activity.address && (
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  {activity.address}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MapDetail({ legs, onClose }: { legs: Leg[]; onClose: () => void }) {
  const mappedLegs = legs.filter(
    (leg) => leg.latitude !== null && leg.longitude !== null,
  );
  const asiaLegs = mappedLegs.filter((leg) => !isMapOutlier(leg));
  const mapLegs = asiaLegs.length > 0 ? asiaLegs : mappedLegs;
  const [selectedLegId, setSelectedLegId] = useState(mapLegs[0]?.leg_id ?? "");
  const selectedLeg =
    mapLegs.find((leg) => leg.leg_id === selectedLegId) ?? mapLegs[0];

  return (
    <Overlay onClose={onClose} closeLabel="Close map">
      <p className="text-sm font-semibold text-[var(--color-muted)]">Map</p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">Trip Pins</h2>

      <div className="relative mt-6 h-[520px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <TripMap
          legs={mapLegs}
          onSelectLeg={setSelectedLegId}
          selectedLegId={selectedLeg?.leg_id ?? ""}
        />
      </div>

      {selectedLeg && (
        <a
          className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
          href={getGoogleMapsUrl(selectedLeg)}
          rel="noreferrer"
          target="_blank"
        >
          <span className="min-w-0">
            <span className="block text-lg font-semibold">{selectedLeg.city}</span>
            <span className="mt-1 block text-sm font-semibold text-[var(--color-muted)]">
              {formatShortDate(selectedLeg.arrive)} - {formatShortDate(selectedLeg.leave)}
            </span>
            <span className="mt-1 block truncate text-sm text-[var(--color-muted)]">
              {selectedLeg.stay_name}
            </span>
          </span>
          <ExternalLink className="shrink-0 text-[var(--color-muted)]" size={18} />
        </a>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {mapLegs.map((leg) => (
          <button
            key={leg.leg_id}
            type="button"
            className={`rounded-lg border p-3 text-left transition ${
              leg.leg_id === selectedLeg?.leg_id
                ? "border-[var(--color-leather)] bg-[var(--color-surface)]"
                : "border-white/60 bg-[var(--color-surface)]/70"
            }`}
            onClick={() => setSelectedLegId(leg.leg_id)}
          >
            <span className="block truncate text-sm font-semibold">{leg.city}</span>
            <span className="mt-1 block text-xs font-semibold text-[var(--color-muted)]">
              {formatShortDate(leg.arrive)}
            </span>
          </button>
        ))}
      </div>

      {mappedLegs.length > mapLegs.length && (
        <p className="mt-4 text-sm font-semibold text-[var(--color-muted)]">
          Seattle and Hawaii are left off this map so Asia stays readable.
        </p>
      )}

      {legs.length > mappedLegs.length && (
        <div className="mt-4 space-y-2">
          {legs
            .filter((leg) => leg.latitude === null || leg.longitude === null)
            .map((leg) => (
          <a
            key={leg.leg_id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)]"
            href={getGoogleMapsUrl(leg)}
            rel="noreferrer"
            target="_blank"
          >
            <span className="min-w-0">
              <span className="block font-semibold">{leg.city}</span>
              <span className="mt-1 block truncate text-sm text-[var(--color-muted)]">
                {leg.stay_name}
              </span>
            </span>
            <ExternalLink className="shrink-0 text-[var(--color-muted)]" size={17} />
          </a>
            ))}
        </div>
      )}
    </Overlay>
  );
}

function LegDetail({
  activities,
  leg,
  onClose,
  onSelectActivity,
}: {
  activities: Activity[];
  leg: Leg;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
}) {
  const [isStayOpen, setIsStayOpen] = useState(false);
  const activityGroups = useMemo(() => groupActivitiesByDate(activities), [activities]);

  return (
    <Overlay onClose={onClose} closeLabel="Close leg">
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        {formatLegDateRange(leg)} · {formatNights(leg.nights)}
      </p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">{leg.city}</h2>
      <p className="mt-1 text-lg font-semibold text-[var(--color-leather)]">
        {leg.country}
      </p>
      <p className="mt-5 text-base leading-7">{leg.why}</p>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setIsStayOpen((isOpen) => !isOpen)}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
              <MapPin size={16} />
              Stay
            </span>
            <ChevronRight
              className={`shrink-0 text-[var(--color-muted)] transition ${
                isStayOpen ? "rotate-90" : ""
              }`}
              size={18}
            />
          </span>
          <span className="mt-2 block font-semibold">{leg.stay_name}</span>
        </button>
        {isStayOpen && (
          <div className="mt-4 border-t border-[var(--color-border)]/35 pt-4">
            <p className="whitespace-pre-line text-base font-semibold leading-7">
              {leg.stay_address}
            </p>
            <a
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-green)] px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/20"
              href={getStayGoogleMapsUrl(leg)}
              rel="noreferrer"
              target="_blank"
            >
              Open in Google Maps
              <ExternalLink size={15} />
            </a>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-5">
        {activityGroups.map((group) => (
          <section key={group.date}>
            <h3 className="mb-2 text-sm font-bold uppercase text-[var(--color-muted)]">
              {formatLegDayHeader(group.date)}
            </h3>
            <div className="space-y-3">
              {group.activities.map((activity) => (
                <CompactActivityRow
                  key={activity.activity_id}
                  activity={activity}
                  onSelect={() => onSelectActivity(activity)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Overlay>
  );
}

function CategoryDetail({
  activities,
  category,
  legs,
  onClose,
  onSelectActivity,
}: {
  activities: Activity[];
  category: Category;
  legs: Leg[];
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
}) {
  return (
    <Overlay onClose={onClose} closeLabel="Close category">
      <p className="text-5xl leading-none">{category.emoji}</p>
      <h2 className="mt-5 text-4xl font-semibold leading-tight">
        {category.description}
      </h2>
      <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
        {activities.length} activities
      </p>

      <div className="mt-6 space-y-3">
        {activities.map((activity) => {
          const leg = legs.find((item) => item.leg_id === activity.leg_id);

          return (
            <button
              key={activity.activity_id}
              type="button"
              className="w-full rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)]"
              onClick={() => onSelectActivity(activity)}
            >
              <span className="block text-sm font-semibold text-[var(--color-muted)]">
                {formatShortDate(activity.date)} · {leg?.city ?? "Trip"}
              </span>
              <span className="mt-1 block text-lg font-semibold leading-snug">
                {activity.title}
              </span>
            </button>
          );
        })}
      </div>
    </Overlay>
  );
}

function SearchDetail({
  activities,
  categoryById,
  legs,
  onClose,
  onSelectActivity,
}: {
  activities: Activity[];
  categoryById: Map<string, Category>;
  legs: Leg[];
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
}) {
  const [query, setQuery] = useState("");
  const cleanQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (cleanQuery.length < 2) return [];

    return activities
      .filter((activity) => {
        const haystack = `${activity.title} ${activity.description ?? ""}`.toLowerCase();
        return haystack.includes(cleanQuery);
      })
      .slice(0, 40);
  }, [activities, cleanQuery]);

  return (
    <Overlay onClose={onClose} closeLabel="Close search">
      <p className="text-sm font-semibold text-[var(--color-muted)]">Search</p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">Activities</h2>

      <label className="mt-6 block">
        <span className="sr-only">Search activity titles and descriptions</span>
        <div className="flex h-12 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 shadow-[var(--shadow-card)]">
          <Search className="shrink-0 text-[var(--color-muted)]" size={18} />
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
            inputMode="search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Activity title or notes"
            type="search"
            value={query}
          />
        </div>
      </label>

      <div className="mt-6 space-y-3">
        {cleanQuery.length < 2 ? (
          <p className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-muted)] shadow-[var(--shadow-card)]">
            Type at least two letters.
          </p>
        ) : results.length > 0 ? (
          results.map((activity) => {
            const leg = legs.find((item) => item.leg_id === activity.leg_id);
            const category = categoryById.get(activity.category);

            return (
              <button
                key={activity.activity_id}
                type="button"
                className="w-full rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)]"
                onClick={() => onSelectActivity(activity)}
              >
                <span className="block text-sm font-semibold text-[var(--color-muted)]">
                  {formatShortDate(activity.date)} · {leg?.city ?? "Trip"}
                  {category ? ` · ${category.emoji}` : ""}
                </span>
                <span className="mt-1 block text-lg font-semibold leading-snug">
                  {activity.title}
                </span>
                {activity.description && (
                  <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[var(--color-muted)]">
                    {activity.description}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <p className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-muted)] shadow-[var(--shadow-card)]">
            No matching activities.
          </p>
        )}
      </div>
    </Overlay>
  );
}

function PhrasebookDetail({
  activeLanguage,
  onClose,
  phrases,
}: {
  activeLanguage: string;
  onClose: () => void;
  phrases: Phrase[];
}) {
  const groupedPhrases = useMemo(() => {
    const languageGroups = new Map<string, PhraseLanguageGroup>();

    phrases.forEach((phrase) => {
      const group =
        languageGroups.get(phrase.language) ??
        ({
          categories: new Map<string, Phrase[]>(),
          language: phrase.language,
          phraseCount: 0,
        } satisfies PhraseLanguageGroup);

      group.categories.set(phrase.category, [
        ...(group.categories.get(phrase.category) ?? []),
        phrase,
      ]);
      group.phraseCount += 1;
      languageGroups.set(phrase.language, group);
    });

    const preferredLanguage = isEnglishLanguage(activeLanguage) ? null : activeLanguage;

    return Array.from(languageGroups.values()).sort((first, second) => {
      if (first.language === preferredLanguage) return -1;
      if (second.language === preferredLanguage) return 1;
      return first.language.localeCompare(second.language);
    });
  }, [activeLanguage, phrases]);

  const defaultLanguage =
    groupedPhrases.find((group) => group.language === activeLanguage)?.language ??
    (isEnglishLanguage(activeLanguage) ? null : groupedPhrases[0]?.language ?? null);
  const defaultCategory = defaultLanguage
    ? getFirstPhraseCategoryKey(groupedPhrases, defaultLanguage)
    : null;
  const [expandedLanguage, setExpandedLanguage] = useState<string | null>(
    defaultLanguage,
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    defaultCategory,
  );
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);

  return (
    <Overlay onClose={onClose} closeLabel="Close phrases">
      <p className="text-sm font-semibold text-[var(--color-muted)]">Phrasebook</p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">Useful Words</h2>

      <div className="mt-6 divide-y divide-[var(--color-border)]/35 overflow-hidden rounded-xl border border-white/60 bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        {groupedPhrases.map((group) => {
          const isExpanded = expandedLanguage === group.language;

          return (
            <section
              key={group.language}
              className="bg-[var(--color-surface)]"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/25"
                onClick={() => {
                  setExpandedLanguage(isExpanded ? null : group.language);
                  setExpandedCategory(
                    isExpanded
                      ? null
                      : getFirstPhraseCategoryKey(groupedPhrases, group.language),
                  );
                }}
              >
                <span>
                  <span className="block text-lg font-semibold">{group.language}</span>
                  <span className="mt-1 block text-sm text-[var(--color-muted)]">
                    {formatPhraseCount(group.categories.size, "category")} ·{" "}
                    {formatPhraseCount(group.phraseCount, "phrase")}
                  </span>
                </span>
                <ChevronRight
                  className={`shrink-0 text-[var(--color-muted)] transition ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  size={20}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-[var(--color-border)]/25 bg-[var(--color-app)]/30 px-3 py-3">
                  {Array.from(group.categories.entries()).map(([category, items]) => (
                    <PhraseCategoryGroup
                      key={`${group.language}-${category}`}
                      category={category}
                      isExpanded={
                        expandedCategory === getPhraseCategoryKey(group.language, category)
                      }
                      onToggle={() => {
                        const key = getPhraseCategoryKey(group.language, category);
                        setExpandedCategory((current) =>
                          current === key ? null : key,
                        );
                      }}
                      onSelectPhrase={setSelectedPhrase}
                      phrases={items}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPhrase && (
          <PhraseDisplay
            phrase={selectedPhrase}
            onClose={() => setSelectedPhrase(null)}
          />
        )}
      </AnimatePresence>
    </Overlay>
  );
}

type PhraseLanguageGroup = {
  categories: Map<string, Phrase[]>;
  language: string;
  phraseCount: number;
};

function PhraseDisplay({
  onClose,
  phrase,
}: {
  onClose: () => void;
  phrase: Phrase;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <motion.button
        type="button"
        className="flex min-h-[58vh] w-full max-w-[720px] flex-col items-center justify-center rounded-xl bg-[var(--color-app)] p-7 text-center shadow-2xl sm:aspect-[16/9] sm:min-h-0"
        initial={{ opacity: 0.92, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ damping: 24, stiffness: 250, type: "spring" }}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="text-base font-semibold text-[var(--color-muted)]">
          {phrase.english}
        </span>
        <span className="mt-8 max-w-full text-balance text-5xl font-semibold leading-tight sm:text-7xl">
          {phrase.script}
        </span>
      </motion.button>
    </motion.div>
  );
}

function PhraseCategoryGroup({
  category,
  isExpanded,
  onSelectPhrase,
  onToggle,
  phrases,
}: {
  category: string;
  isExpanded: boolean;
  onSelectPhrase: (phrase: Phrase) => void;
  onToggle: () => void;
  phrases: Phrase[];
}) {
  return (
    <div className="border-b border-[var(--color-border)]/25 last:border-b-0">
      <button
        type="button"
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-white/35"
        onClick={onToggle}
      >
        <span>
          <span className="block text-sm font-bold uppercase text-[var(--color-muted)]">
            {category}
          </span>
          <span className="mt-1 block text-sm text-[var(--color-muted)]">
            {formatPhraseCount(phrases.length, "phrase")}
          </span>
        </span>
        <ChevronRight
          className={`shrink-0 text-[var(--color-muted)] transition ${
            isExpanded ? "rotate-90" : ""
          }`}
          size={18}
        />
      </button>

      {isExpanded && (
        <div className="space-y-2 pb-3">
          {phrases.map((phrase) => (
            <button
              key={`${category}-${phrase.english}-${phrase.script}`}
              type="button"
              className="w-full rounded-lg border border-[var(--color-border)]/35 bg-[var(--color-app)]/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--color-app)]"
              onClick={() => onSelectPhrase(phrase)}
            >
              <span className="block text-sm font-semibold text-[var(--color-muted)]">
                {phrase.english}
              </span>
              <span className="mt-1 block text-xl font-semibold">
                {phrase.script}
              </span>
              <span className="mt-1 block text-sm font-semibold text-[var(--color-leather)]">
                {phrase.pronunciation}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getFirstPhraseCategoryKey(
  groups: PhraseLanguageGroup[],
  language: string,
): string | null {
  const category = groups.find((group) => group.language === language)?.categories
    .keys()
    .next().value;

  return category ? getPhraseCategoryKey(language, category) : null;
}

function getPhraseCategoryKey(language: string, category: string): string {
  return `${language}::${category}`;
}

function formatPhraseCount(count: number, noun: string): string {
  if (noun === "category") {
    return `${count} ${count === 1 ? "category" : "categories"}`;
  }

  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function CompactActivityRow({
  activity,
  onSelect,
}: {
  activity: Activity;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        {formatShortDate(activity.date)}
        {activity.start_time ? ` · ${formatTimeRange(activity)}` : ""}
      </p>
      <p className="mt-1 text-lg font-semibold leading-snug">{activity.title}</p>
      {activity.url && !onSelect && (
        <a
          className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-blue)]"
          href={activity.url}
          rel="noreferrer"
          target="_blank"
        >
          Open
          <ExternalLink size={14} />
        </a>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className="w-full rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)]"
        onClick={onSelect}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      {content}
    </div>
  );
}

function Overlay({
  children,
  closeLabel,
  onClose,
}: {
  children: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
}) {
  const touchStartY = useRef<number | null>(null);
  const touchStartScrollTop = useRef(0);

  return (
    <motion.div
      className="fixed inset-0 z-30 bg-stone-950/35 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="mx-auto flex max-h-dvh min-h-dvh w-full max-w-[440px] flex-col overflow-y-auto overscroll-contain bg-[var(--color-app)] px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-2xl"
        initial={{ borderRadius: 22, opacity: 0.96, scale: 0.94, y: 80 }}
        animate={{ borderRadius: 0, opacity: 1, scale: 1, y: 0 }}
        onTouchEnd={(event) => {
          const startY = touchStartY.current;
          const touch = event.changedTouches[0];

          if (startY !== null && touch && touch.clientY - startY > 68 && touchStartScrollTop.current < 8) {
            onClose();
          }

          touchStartY.current = null;
        }}
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0]?.clientY ?? null;
          touchStartScrollTop.current = event.currentTarget.scrollTop;
        }}
        exit={{ borderRadius: 22, opacity: 0, scale: 0.96, y: 60 }}
        transition={{ damping: 28, stiffness: 260, type: "spring" }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={closeLabel}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] shadow-sm"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function getHeaderTitle(activeTab: TabId, leg: Leg): string {
  if (activeTab === "today") return leg.city;
  if (activeTab === "legs") return "Trip Legs";
  if (activeTab === "categories") return "Categories";
  return "Calendar";
}

function getActiveDay(legs: Leg[], activities: Activity[]) {
  const firstLeg = legs[0];

  if (!firstLeg) {
    throw new Error("No legs found in sheet.");
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const currentLeg =
    legs.find((leg) => currentDate >= leg.arrive && currentDate < leg.leave) ??
    (currentDate < firstLeg.arrive ? firstLeg : legs.at(-1) ?? firstLeg);

  const date =
    currentDate >= currentLeg.arrive && currentDate < currentLeg.leave
      ? currentDate
      : currentLeg.arrive;

  return getTripDay(legs, activities, date) ?? {
    date,
    leg: currentLeg,
    activities: [],
  };
}

function getTripDay(legs: Leg[], activities: Activity[], date: string) {
  const leg = getLegForDate(legs, date);

  if (!leg) return null;

  return {
    date,
    leg,
    activities: activities.filter(
      (activity) => activity.date === date && activity.leg_id === leg.leg_id,
    ),
  };
}

function getTripDates(legs: Leg[]): string[] {
  return Array.from(
    new Set(legs.flatMap((leg) => getDateRange(leg.arrive, leg.leave))),
  ).sort();
}

function getLegQueueStatus(
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

function formatTimeRange(activity: Activity): string {
  if (activity.start_time && activity.end_time) {
    return `${activity.start_time} - ${activity.end_time}`;
  }

  return activity.start_time ?? "";
}

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatLegDayHeader(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDayNumber(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatLegDateRange(leg: Leg): string {
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

function formatNights(nights: number): string {
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function buildCalendarRows(dates: string[], legs: Leg[]): CalendarSegment[][] {
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
        const legIndex = getLegIndex(legs, leg);
        const previousLegIndex = getLegIndex(legs, previousLeg);

        row.push({
          background: `linear-gradient(to bottom, ${getLegColor(previousLegIndex)} 0 50%, ${getLegColor(legIndex)} 50% 100%)`,
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
        background: getLegColor(getLegIndex(legs, leg)),
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

function getLegForDate(legs: Leg[], date: string): Leg | undefined {
  return legs.find((leg) => date >= leg.arrive && date < leg.leave);
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

function getLegIndex(legs: Leg[], leg: Leg | undefined): number {
  if (!leg) return 0;

  const index = legs.findIndex((item) => item.leg_id === leg.leg_id);
  return index >= 0 ? index : 0;
}

function getLegColor(index: number): string {
  const colors = [
    "rgba(31, 63, 45, 0.18)",
    "rgba(177, 122, 37, 0.22)",
    "rgba(90, 54, 32, 0.18)",
    "rgba(40, 95, 101, 0.18)",
    "rgba(132, 92, 37, 0.2)",
    "rgba(76, 98, 57, 0.2)",
  ];

  return colors[index % colors.length];
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

function isEnglishLanguage(language: string): boolean {
  return ["english", "en"].includes(language.trim().toLowerCase());
}

function isMapOutlier(leg: Leg): boolean {
  return leg.country.trim().toLowerCase() === "us";
}

function getGoogleMapsUrl(leg: Leg): string {
  if (leg.latitude !== null && leg.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${leg.latitude},${leg.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${leg.stay_address || leg.city}, ${leg.country}`,
  )}`;
}

function getStayGoogleMapsUrl(leg: Leg): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    leg.stay_address || `${leg.stay_name}, ${leg.city}, ${leg.country}`,
  )}`;
}

function groupActivitiesByDate(
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
