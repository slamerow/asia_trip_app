import type { Leg } from "@/lib/trip-data";

export const PHOTO_TRIP_ID = "asia-2026";
export const PHOTO_BUCKET = "trip-photos";
export const PHOTO_CAPTION_LIMIT = 280;

export type TripPhoto = {
  caption: string | null;
  capturedAt: string | null;
  height: number;
  legId: string;
  photoId: string;
  publishedAt: string;
  tripDate: string;
  uploaderEmail: string;
  url: string;
  width: number;
};

export type PhotoFilter = {
  date?: string;
  legId?: string;
};

export function getPhotoAlt(photo: TripPhoto, legs: Leg[]): string {
  if (photo.caption?.trim()) return photo.caption.trim();

  const leg = legs.find((item) => item.leg_id === photo.legId);
  return `Photo from ${leg?.city ?? "the trip"} on ${formatPhotoDate(photo.tripDate)}`;
}

export function formatPhotoDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function getLegForPhotoDate(legs: Leg[], date: string): Leg | undefined {
  return legs.find((leg) => date >= leg.arrive && date < leg.leave);
}
