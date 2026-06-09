"use client";

import {
  CalendarDays,
  ChevronRight,
  Clock,
  CloudSun,
  Languages,
  MapPinned,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import { useMemo, useState } from "react";

type TabId = "legs" | "categories" | "today" | "calendar";

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "legs", label: "Legs", icon: MapPinned },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "today", label: "Today", icon: Sparkles },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

const dayCards = [
  {
    time: "10:00",
    title: "Hakone Loop",
    category: "Nature + shrines",
    emoji: "🌿",
    description: "Ropeway, lake views, and a slow afternoon around Hakone.",
  },
  {
    time: "15:30",
    title: "Onsen Reset",
    category: "Wellness",
    emoji: "💆",
    description: "A quiet block for baths, naps, and dinner at the ryokan.",
  },
];

const legs = [
  ["Seattle", "Jun 27 - Jul 2", "US", "5 nights"],
  ["Maui", "Jul 2 - Jul 7", "US", "5 nights"],
  ["Hakone", "Jul 26 - Jul 29", "Japan", "3 nights"],
  ["Ubud", "Sep 27 - Oct 26", "Indonesia", "29 nights"],
];

const categories = [
  ["✈️", "Flights + transfers"],
  ["🍜", "Food + dining"],
  ["⛩️", "Temples + shrines"],
  ["🌿", "Nature + outdoors"],
  ["🧸", "Wren time"],
  ["💆", "Wellness"],
];

const calendarDays = Array.from({ length: 35 }, (_, index) => index + 1);

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("today");

  const title = useMemo(() => {
    if (activeTab === "today") return "Hakone";
    if (activeTab === "legs") return "Trip Legs";
    if (activeTab === "categories") return "Categories";
    return "July 2026";
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-[var(--color-app)] shadow-2xl shadow-stone-950/10">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-app)]/95 px-5 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-muted)]">
                Monday, July 27
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
          <p className="mt-3 truncate text-sm text-[var(--color-muted)]">
            Mountain air, lake views, and a gentle travel day pace.
          </p>
        </header>

        <section className="flex-1 px-5 pb-28 pt-5">
          {activeTab === "today" && <TodayPanel />}
          {activeTab === "legs" && <LegsPanel />}
          {activeTab === "categories" && <CategoriesPanel />}
          {activeTab === "calendar" && <CalendarPanel />}
        </section>

        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[440px] -translate-x-1/2 border-t border-[var(--color-border)] bg-[var(--color-app)]/96 px-3 pb-3 pt-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[var(--color-green)] text-white"
                      : "text-[var(--color-muted)] hover:bg-white"
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
      </div>
    </main>
  );
}

function TodayPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-[var(--color-sky)] p-4 text-[var(--color-ink)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              Weather
            </p>
            <p className="mt-1 text-2xl font-semibold">72° / 64°</p>
          </div>
          <CloudSun className="text-[var(--color-blue)]" size={36} />
        </div>
      </div>

      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
        {dayCards.map((card) => (
          <article
            key={card.title}
            className="flex h-[220px] min-w-[85%] flex-col justify-between rounded-lg bg-[var(--color-surface)] p-5 shadow-lg shadow-stone-950/8"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
              <Clock size={16} />
              <span>{card.time}</span>
            </div>
            <div>
              <h2 className="text-3xl font-semibold leading-tight">
                {card.title}
              </h2>
              <p className="mt-3 text-base leading-6 text-[var(--color-muted)]">
                {card.description}
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              <span className="mr-2">{card.emoji}</span>
              {card.category}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LegsPanel() {
  return (
    <div className="space-y-3">
      {legs.map(([city, dates, country, nights]) => (
        <button
          key={`${city}-${dates}`}
          type="button"
          className="flex w-full items-center justify-between rounded-lg bg-[var(--color-surface)] p-4 text-left shadow-sm shadow-stone-950/5"
        >
          <span>
            <span className="block text-lg font-semibold">{city}</span>
            <span className="mt-1 block text-sm text-[var(--color-muted)]">
              {dates} · {country} · {nights}
            </span>
          </span>
          <ChevronRight className="text-[var(--color-muted)]" size={20} />
        </button>
      ))}
    </div>
  );
}

function CategoriesPanel() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map(([emoji, label]) => (
        <button
          key={label}
          type="button"
          className="aspect-[1.08] rounded-lg bg-[var(--color-surface)] p-4 text-left shadow-sm shadow-stone-950/5"
        >
          <span className="block text-4xl">{emoji}</span>
          <span className="mt-4 block text-lg font-semibold leading-tight">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

function CalendarPanel() {
  return (
    <div className="rounded-lg bg-[var(--color-surface)] p-3 shadow-sm shadow-stone-950/5">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--color-muted)]">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isTripDay = day >= 2 && day <= 31;
          const hasActivity = [7, 12, 20, 26, 27, 29].includes(day);

          return (
            <button
              key={day}
              type="button"
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-sm font-semibold ${
                isTripDay
                  ? "bg-white text-[var(--color-ink)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              <span>{day}</span>
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${
                  hasActivity ? "bg-[var(--color-green)]" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
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
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm shadow-stone-950/5"
    >
      {children}
    </button>
  );
}
