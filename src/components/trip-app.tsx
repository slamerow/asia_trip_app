"use client";

import type { Activity, Category, Leg, TripData } from "@/lib/trip-data";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  CloudSun,
  MapPin,
  Languages,
  MapPinned,
  Search,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type TabId = "legs" | "categories" | "today" | "calendar";

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "legs", label: "Legs", icon: MapPinned },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "today", label: "Today", icon: Sparkles },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function TripApp({ data }: { data: TripData }) {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const categoryById = useMemo(
    () => new Map(data.categories.map((category) => [category.category_id, category])),
    [data.categories],
  );

  const activeDay = useMemo(() => getActiveDay(data.legs, data.activities), [data]);
  const title = getHeaderTitle(activeTab, activeDay.leg);

  return (
    <main className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col border-x border-black/5 bg-[var(--color-app)] shadow-2xl shadow-stone-950/20">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-app)]/95 px-5 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-muted)]">
                {formatLongDate(activeDay.date)}
              </p>
              <h1 className="mt-1 truncate text-4xl font-semibold tracking-normal">
                {title}
              </h1>
            </div>
            <div className="flex shrink-0 gap-2">
              <IconButton label="Search">
                <Search size={19} />
              </IconButton>
              <IconButton label="Phrases">
                <Languages size={19} />
              </IconButton>
            </div>
          </div>
        </header>

        <section className="flex-1 px-5 pb-28 pt-5">
          {activeTab === "today" && (
            <TodayPanel
              activities={activeDay.activities}
              categoryById={categoryById}
              date={activeDay.date}
              onSelectActivity={setSelectedActivity}
            />
          )}
          {activeTab === "legs" && <LegsPanel legs={data.legs} />}
          {activeTab === "categories" && (
            <CategoriesPanel categories={data.categories} activities={data.activities} />
          )}
          {activeTab === "calendar" && (
            <CalendarPanel activities={data.activities} legs={data.legs} />
          )}
        </section>

        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[440px] -translate-x-1/2 border-t border-[var(--color-border)] bg-[var(--color-app)]/96 px-3 pb-3 pt-2 backdrop-blur">
          <div className="grid grid-cols-4 items-end gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isToday = tab.id === "today";

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[var(--color-green)] text-white shadow-lg shadow-emerald-950/25"
                      : "text-[var(--color-muted)] hover:bg-white/70"
                  } ${
                    isToday
                      ? "h-[68px] -translate-y-3 border border-white/40"
                      : "h-14"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={isToday ? 23 : 20} strokeWidth={2.2} />
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
        </AnimatePresence>
      </div>
    </main>
  );
}

function TodayPanel({
  activities,
  categoryById,
  date,
  onSelectActivity,
}: {
  activities: Activity[];
  categoryById: Map<string, Category>;
  date: string;
  onSelectActivity: (activity: Activity) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/70 bg-[var(--color-sky)] p-4 text-[var(--color-ink)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              Weather
            </p>
            <p className="mt-1 text-2xl font-semibold">High -- / Low --</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-blue)]">
              Forecast coming next
            </p>
          </div>
          <CloudSun className="text-[var(--color-blue)]" size={36} />
        </div>
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-4 pt-1">
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
          <RestDayCard date={date} />
        )}
        <div className="shrink-0 basis-[11%]" aria-hidden="true" />
      </div>
    </div>
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
      className="mx-2 flex h-[235px] shrink-0 basis-[78%] snap-center flex-col justify-between rounded-xl border border-white/70 bg-[var(--color-surface)] p-5 text-left shadow-[var(--shadow-card)] outline outline-1 outline-black/5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
      onClick={onSelect}
    >
      {activity.start_time ? (
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
          <Clock size={16} />
          <span>{formatTimeRange(activity)}</span>
        </div>
      ) : (
        <div className="text-sm font-medium text-[var(--color-muted)]">
          Anytime
        </div>
      )}
      <div>
        <h2 className="line-clamp-4 text-3xl font-semibold leading-tight">
          {activity.title}
        </h2>
      </div>
      <p className="text-3xl leading-none">{category?.emoji ?? "•"}</p>
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

function LegsPanel({ legs }: { legs: Leg[] }) {
  return (
    <div className="space-y-3">
      {legs.map((leg) => (
        <button
          key={leg.leg_id}
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)] outline outline-1 outline-black/5"
        >
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold">{leg.city}</span>
            <span className="mt-1 block text-sm text-[var(--color-muted)]">
              {formatShortDate(leg.arrive)} - {formatShortDate(leg.leave)} ·{" "}
              {leg.country} · {leg.nights} nights
            </span>
            <span className="mt-1 block truncate text-sm text-[var(--color-muted)]">
              {leg.stay_name}
            </span>
          </span>
          <ChevronRight className="ml-3 shrink-0 text-[var(--color-muted)]" size={20} />
        </button>
      ))}
    </div>
  );
}

function CategoriesPanel({
  activities,
  categories,
}: {
  activities: Activity[];
  categories: Category[];
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
          className="aspect-[1.08] rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)] outline outline-1 outline-black/5"
        >
          <span className="block text-4xl">{category.emoji}</span>
          <span className="mt-4 line-clamp-2 block text-lg font-semibold leading-tight">
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
}: {
  activities: Activity[];
  legs: Leg[];
}) {
  const activityCountByDate = useMemo(() => {
    const counts = new Map<string, number>();

    activities.forEach((activity) => {
      counts.set(activity.date, (counts.get(activity.date) ?? 0) + 1);
    });

    return counts;
  }, [activities]);

  const visibleDates = useMemo(() => {
    const start = legs[0]?.arrive;
    const end = legs.at(-1)?.leave;

    if (!start || !end) return [];

    return getDateRange(start, end).slice(0, 35);
  }, [legs]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold text-[var(--color-muted)]">
          First 35 trip days
        </p>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {visibleDates.map((date) => {
            const day = Number(date.slice(-2));
            const activityCount = activityCountByDate.get(date) ?? 0;

            return (
              <button
                key={date}
                type="button"
                title={`${formatLongDate(date)}: ${activityCount} activities`}
                className="flex aspect-square flex-col items-center justify-center rounded-md bg-white/80 text-sm font-semibold text-[var(--color-ink)] shadow-sm"
              >
                <span>{day}</span>
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                    activityCount > 0 ? "bg-[var(--color-green)]" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-sm leading-6 text-[var(--color-muted)]">
        Full month navigation comes next. This view is already reading activity
        dates from the sheet.
      </p>
    </div>
  );
}

function IconButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm shadow-stone-950/10"
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
  return (
    <motion.div
      className="fixed inset-0 z-30 bg-stone-950/35 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-[var(--color-app)] px-5 pb-8 pt-5 shadow-2xl"
        initial={{ borderRadius: 22, opacity: 0.96, scale: 0.94, y: 80 }}
        animate={{ borderRadius: 0, opacity: 1, scale: 1, y: 0 }}
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

  return {
    date,
    leg: currentLeg,
    activities: activities.filter(
      (activity) => activity.date === date && activity.leg_id === currentLeg.leg_id,
    ),
  };
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

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
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
