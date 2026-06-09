"use client";

import type { Activity, Category, Leg, Phrase, TripData } from "@/lib/trip-data";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudSun,
  ExternalLink,
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
type CalendarSegment = {
  background: string;
  dateLabel: string;
  key: string;
  label: string;
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

export function TripApp({ data }: { data: TripData }) {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<Leg | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState(false);

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
              categoryById={categoryById}
              date={activeDay.date}
              onSelectActivity={setSelectedActivity}
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
              onSelectDate={setSelectedDate}
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
          {selectedDate && (
            <DateDetail
              activities={data.activities.filter((activity) => activity.date === selectedDate)}
              date={selectedDate}
              leg={getLegForDate(data.legs, selectedDate)}
              onClose={() => setSelectedDate(null)}
              onSelectActivity={(activity) => {
                setSelectedDate(null);
                setSelectedActivity(activity);
              }}
            />
          )}
          {isPhrasebookOpen && (
            <PhrasebookDetail
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

function LegsPanel({
  legs,
  onSelectLeg,
}: {
  legs: Leg[];
  onSelectLeg: (leg: Leg) => void;
}) {
  return (
    <div className="space-y-3">
      {legs.map((leg) => (
        <button
          key={leg.leg_id}
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)] outline outline-1 outline-black/5"
          onClick={() => onSelectLeg(leg)}
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
}: {
  activities: Activity[];
  legs: Leg[];
  onSelectDate: (date: string) => void;
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
    <div className="space-y-4">
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
                  onClick={() => onSelectDate(segment.value)}
                >
                  <span className="text-[10px] font-semibold leading-none text-[var(--color-muted)]">
                    {segment.dateLabel}
                  </span>
                  {(segment.label || activityCounts.get(segment.value)) && (
                    <span className="truncate text-[11px] font-bold leading-tight">
                      {segment.label ||
                        `${activityCounts.get(segment.value) ?? 0} plans`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm leading-6 text-[var(--color-muted)]">
        Split days show a transition from one place to the next.
      </p>
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

function LegDetail({
  activities,
  leg,
  onClose,
}: {
  activities: Activity[];
  leg: Leg;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose} closeLabel="Close leg">
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        {formatShortDate(leg.arrive)} - {formatShortDate(leg.leave)} · {leg.nights} nights
      </p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">{leg.city}</h2>
      <p className="mt-1 text-lg font-semibold text-[var(--color-leather)]">
        {leg.country}
      </p>
      <p className="mt-5 text-base leading-7">{leg.why}</p>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
          <MapPin size={16} />
          Stay
        </p>
        <p className="mt-2 font-semibold">{leg.stay_name}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
          {leg.stay_address}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {activities.slice(0, 6).map((activity) => (
          <CompactActivityRow key={activity.activity_id} activity={activity} />
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

function DateDetail({
  activities,
  date,
  leg,
  onClose,
  onSelectActivity,
}: {
  activities: Activity[];
  date: string;
  leg: Leg | undefined;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
}) {
  return (
    <Overlay onClose={onClose} closeLabel="Close date">
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        {formatLongDate(date)}
      </p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">
        {leg?.city ?? "Trip Day"}
      </h2>

      <div className="mt-6 space-y-3">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <button
              key={activity.activity_id}
              type="button"
              className="w-full rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-card)]"
              onClick={() => onSelectActivity(activity)}
            >
              <span className="block text-sm font-semibold text-[var(--color-muted)]">
                {activity.start_time ? formatTimeRange(activity) : "Anytime"}
              </span>
              <span className="mt-1 block text-lg font-semibold leading-snug">
                {activity.title}
              </span>
            </button>
          ))
        ) : (
          <p className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-muted)] shadow-[var(--shadow-card)]">
            No plans on the sheet for this day.
          </p>
        )}
      </div>
    </Overlay>
  );
}

function PhrasebookDetail({
  onClose,
  phrases,
}: {
  onClose: () => void;
  phrases: Phrase[];
}) {
  const groupedPhrases = useMemo(() => {
    const groups = new Map<string, Phrase[]>();

    phrases.forEach((phrase) => {
      const key = `${phrase.language} · ${phrase.category}`;
      groups.set(key, [...(groups.get(key) ?? []), phrase]);
    });

    return Array.from(groups.entries());
  }, [phrases]);

  return (
    <Overlay onClose={onClose} closeLabel="Close phrases">
      <p className="text-sm font-semibold text-[var(--color-muted)]">Phrasebook</p>
      <h2 className="mt-2 text-4xl font-semibold leading-tight">Useful Words</h2>

      <div className="mt-6 space-y-5">
        {groupedPhrases.map(([group, items]) => (
          <section key={group}>
            <h3 className="text-sm font-bold uppercase text-[var(--color-muted)]">
              {group}
            </h3>
            <div className="mt-2 space-y-2">
              {items.map((phrase) => (
                <div
                  key={`${group}-${phrase.english}-${phrase.script}`}
                  className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
                >
                  <p className="text-sm font-semibold text-[var(--color-muted)]">
                    {phrase.english}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{phrase.script}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-leather)]">
                    {phrase.pronunciation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Overlay>
  );
}

function CompactActivityRow({ activity }: { activity: Activity }) {
  return (
    <div className="rounded-xl border border-white/60 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        {formatShortDate(activity.date)}
        {activity.start_time ? ` · ${formatTimeRange(activity)}` : ""}
      </p>
      <p className="mt-1 text-lg font-semibold leading-snug">{activity.title}</p>
      {activity.url && (
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
  return (
    <motion.div
      className="fixed inset-0 z-30 bg-stone-950/35 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="mx-auto flex max-h-screen min-h-screen w-full max-w-[440px] flex-col overflow-y-auto bg-[var(--color-app)] px-5 pb-8 pt-5 shadow-2xl"
        initial={{ borderRadius: 22, opacity: 0.96, scale: 0.94, y: 80 }}
        animate={{ borderRadius: 0, opacity: 1, scale: 1, y: 0 }}
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

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function buildCalendarRows(dates: string[], legs: Leg[]): CalendarSegment[][] {
  const labeledLegIds = new Set<string>();
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
      const label =
        leg && !labeledLegIds.has(leg.leg_id) ? shortCity(leg.city) : "";

      if (leg && label) {
        labeledLegIds.add(leg.leg_id);
      }

      row.push({
        background: getLegColor(getLegIndex(legs, leg)),
        dateLabel: formatSegmentDateLabel(segmentDates),
        key: `${segmentDates[0]}-${leg?.leg_id ?? "none"}`,
        label,
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
