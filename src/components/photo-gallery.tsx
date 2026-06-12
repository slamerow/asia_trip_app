"use client";

import type { Leg } from "@/lib/trip-data";
import {
  formatPhotoDate,
  getPhotoAlt,
  PHOTO_CAPTION_LIMIT,
  type PhotoFilter,
  type TripPhoto,
} from "@/lib/photos";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Images, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type MemberSession = {
  configured: boolean;
  email: string | null;
  isMember: boolean;
};

export function PhotoGallery({
  configured,
  filter,
  legs,
  photos: initialPhotos,
}: {
  configured: boolean;
  filter: PhotoFilter;
  legs: Leg[];
  photos: TripPhoto[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [session, setSession] = useState<MemberSession | null>(null);
  const selectedIndex = photos.findIndex((photo) => photo.photoId === selectedId);
  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : null;
  const title = getGalleryTitle(filter, legs);

  useEffect(() => {
    fetch("/api/photos/session")
      .then((response) => response.json() as Promise<MemberSession>)
      .then(setSession)
      .catch(() => setSession({ configured, email: null, isMember: false }));
  }, [configured]);

  return (
    <main className="journal-page min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <div className="journal-app mx-auto min-h-screen w-full max-w-[440px] border-x border-black/10 bg-[var(--color-app)] shadow-2xl shadow-stone-950/25">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-app)]/95 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link
              aria-label="Back to trip"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] shadow-sm"
              href="/"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Trip photos
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold">{title}</h1>
            </div>
            <Link
              aria-label={session?.isMember ? "Add photos" : "Member photo access"}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-green)] text-white shadow-sm"
              href="/photos/upload"
            >
              <Camera size={19} />
            </Link>
          </div>
          {(filter.date || filter.legId) && (
            <Link
              className="mx-auto mt-3 block w-fit text-xs font-bold uppercase tracking-wide text-[var(--color-blue)]"
              href="/photos"
            >
              View all photos
            </Link>
          )}
        </header>

        {!configured ? (
          <GalleryMessage
            icon={<Images size={30} />}
            title="Photo gallery is ready to connect"
            detail="The screens are built. Storage will appear here once the photo service is connected."
          />
        ) : photos.length === 0 ? (
          <GalleryMessage
            icon={<Camera size={30} />}
            title="No photos here yet"
            detail="Trip photos will appear as they are published."
          />
        ) : (
          <div className="pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <PhotoGrid legs={legs} photos={photos} onSelect={setSelectedId} />
          </div>
        )}

        <AnimatePresence>
          {selectedPhoto && (
            <PhotoViewer
              canEdit={Boolean(session?.isMember)}
              legs={legs}
              onChange={(nextPhoto) => {
                setPhotos((items) =>
                  items.map((item) => (item.photoId === nextPhoto.photoId ? nextPhoto : item)),
                );
              }}
              onClose={() => setSelectedId(null)}
              onDelete={(photoId) => {
                setPhotos((items) => items.filter((item) => item.photoId !== photoId));
                setSelectedId(null);
              }}
              onNext={
                selectedIndex < photos.length - 1
                  ? () => setSelectedId(photos[selectedIndex + 1]?.photoId ?? null)
                  : undefined
              }
              onPrevious={
                selectedIndex > 0
                  ? () => setSelectedId(photos[selectedIndex - 1]?.photoId ?? null)
                  : undefined
              }
              photo={selectedPhoto}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function PhotoGrid({
  legs,
  onSelect,
  photos,
}: {
  legs: Leg[];
  onSelect: (photoId: string) => void;
  photos: TripPhoto[];
}) {
  return (
    <div>
      {photos.map((photo, index) => {
        const leg = legs.find((item) => item.leg_id === photo.legId);
        const showDivider = photo.legId !== photos[index - 1]?.legId;

        return (
          <div key={photo.photoId}>
            {showDivider && leg && (
              <div className="border-b border-[var(--color-border)]/25 px-5 pb-3 pt-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-leather)]">
                  {leg.city} · {leg.country}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                  {formatLegDates(leg)}
                </p>
              </div>
            )}
            <button
              type="button"
              className="block w-full bg-stone-900"
              onClick={() => onSelect(photo.photoId)}
            >
              {/* Images are already resized and compressed before upload. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={getPhotoAlt(photo, legs)}
                className="block max-h-[72vh] w-full object-cover"
                height={photo.height}
                loading="lazy"
                src={photo.url}
                width={photo.width}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PhotoViewer({
  canEdit,
  legs,
  onChange,
  onClose,
  onDelete,
  onNext,
  onPrevious,
  photo,
}: {
  canEdit: boolean;
  legs: Leg[];
  onChange: (photo: TripPhoto) => void;
  onClose: () => void;
  onDelete: (photoId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  photo: TripPhoto;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const leg = legs.find((item) => item.leg_id === photo.legId);

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col bg-stone-950 text-white"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button aria-label="Close photo" className="flex h-10 w-10 items-center justify-center" onClick={onClose}>
          <X size={24} />
        </button>
        {canEdit && (
          <button
            className="flex h-10 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-bold"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Pencil size={15} /> Edit
          </button>
        )}
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={getPhotoAlt(photo, legs)}
          className="max-h-full max-w-full object-contain"
          height={photo.height}
          src={photo.url}
          width={photo.width}
        />
        {onPrevious && (
          <button
            aria-label="Previous photo"
            className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/35"
            onClick={onPrevious}
          >
            <ChevronLeft size={28} />
          </button>
        )}
        {onNext && (
          <button
            aria-label="Next photo"
            className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/35"
            onClick={onNext}
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
      <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-sm font-bold">{leg?.city ?? "Trip"}</p>
        <p className="mt-1 text-sm text-white/65">{formatPhotoDate(photo.tripDate)}</p>
        {photo.caption && <p className="mt-3 max-w-xl text-base leading-6">{photo.caption}</p>}
      </div>

      <AnimatePresence>
        {isEditing && (
          <PhotoEditor
            legs={legs}
            onClose={() => setIsEditing(false)}
            onDelete={onDelete}
            onSave={(nextPhoto) => {
              onChange(nextPhoto);
              setIsEditing(false);
            }}
            photo={photo}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PhotoEditor({
  legs,
  onClose,
  onDelete,
  onSave,
  photo,
}: {
  legs: Leg[];
  onClose: () => void;
  onDelete: (photoId: string) => void;
  onSave: (photo: TripPhoto) => void;
  photo: TripPhoto;
}) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [legId, setLegId] = useState(photo.legId);
  const [tripDate, setTripDate] = useState(photo.tripDate);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    setStatus(null);
    const response = await fetch(`/api/photos/${photo.photoId}`, {
      body: JSON.stringify({ caption, legId, tripDate }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    if (!response.ok) {
      const result = (await response.json()) as { message?: string };
      setStatus(result.message ?? "Photo could not be saved.");
      setIsSaving(false);
      return;
    }

    onSave({ ...photo, caption: caption.trim() || null, legId, tripDate });
  };

  const remove = async () => {
    if (!window.confirm("Delete this photo from the trip?")) return;

    setIsSaving(true);
    const response = await fetch(`/api/photos/${photo.photoId}`, { method: "DELETE" });

    if (!response.ok) {
      setStatus("Photo could not be deleted.");
      setIsSaving(false);
      return;
    }

    onDelete(photo.photoId);
  };

  return (
    <motion.div
      animate={{ y: 0 }}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[440px] rounded-t-3xl bg-[var(--color-app)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[var(--color-ink)] shadow-2xl"
      exit={{ y: "100%" }}
      initial={{ y: "100%" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit photo</h2>
        <button aria-label="Close editor" className="flex h-9 w-9 items-center justify-center" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="mt-5 space-y-4">
        <label className="block text-sm font-bold">
          Date
          <input
            className="mt-2 h-11 w-full rounded-lg border border-[var(--color-border)] bg-white/45 px-3"
            onChange={(event) => {
              const nextDate = event.target.value;
              const suggestedLeg = legs.find(
                (leg) => nextDate >= leg.arrive && nextDate < leg.leave,
              );
              setTripDate(nextDate);
              if (suggestedLeg) setLegId(suggestedLeg.leg_id);
            }}
            type="date"
            value={tripDate}
          />
        </label>
        <label className="block text-sm font-bold">
          Leg
          <select
            className="mt-2 h-11 w-full rounded-lg border border-[var(--color-border)] bg-white/45 px-3"
            onChange={(event) => setLegId(event.target.value)}
            value={legId}
          >
            {legs.map((leg) => (
              <option key={leg.leg_id} value={leg.leg_id}>{leg.city}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold">
          Caption
          <textarea
            className="mt-2 min-h-24 w-full resize-none rounded-lg border border-[var(--color-border)] bg-white/45 p-3"
            maxLength={PHOTO_CAPTION_LIMIT}
            onChange={(event) => setCaption(event.target.value)}
            value={caption}
          />
        </label>
      </div>
      {status && <p className="mt-3 text-sm font-semibold text-red-800">{status}</p>}
      <div className="mt-5 flex gap-3">
        <button
          className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[var(--color-green)] font-bold text-white disabled:opacity-50"
          disabled={isSaving}
          onClick={save}
          type="button"
        >
          Save
        </button>
        <button
          aria-label="Delete photo"
          className="flex h-12 w-12 items-center justify-center rounded-lg border border-red-900/25 text-red-900 disabled:opacity-50"
          disabled={isSaving}
          onClick={remove}
          type="button"
        >
          <Trash2 size={19} />
        </button>
      </div>
    </motion.div>
  );
}

function GalleryMessage({ detail, icon, title }: { detail: string; icon: React.ReactNode; title: string }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-blue)]">
        {icon}
      </div>
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">{detail}</p>
    </div>
  );
}

function getGalleryTitle(filter: PhotoFilter, legs: Leg[]): string {
  if (filter.date) return formatPhotoDate(filter.date);
  if (filter.legId) return legs.find((leg) => leg.leg_id === filter.legId)?.city ?? "Photos";
  return "All Photos";
}

function formatLegDates(leg: Leg): string {
  return `${formatPhotoDate(leg.arrive)} – ${formatPhotoDate(leg.leave)}`;
}
