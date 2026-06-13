export type TabId = "legs" | "categories" | "today" | "calendar";

export type CalendarSegment = {
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
