"use client";

import type { Leg } from "@/lib/trip-data";
import { PHOTO_CAPTION_LIMIT, getLegForPhotoDate } from "@/lib/photos";
import imageCompression from "browser-image-compression";
import { ArrowLeft, Check, ImagePlus, LoaderCircle, LogOut, RotateCcw, Upload, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MemberSession = {
  configured: boolean;
  isMember: boolean;
  label: string | null;
};

type ReviewPhoto = {
  caption: string;
  capturedAt: string | null;
  file: File;
  id: string;
  legId: string;
  previewUrl: string;
  sourceLabel: string;
  status: "ready" | "uploading" | "uploaded" | "duplicate" | "failed";
  statusMessage: string | null;
  tripDate: string;
};

export function PhotoUpload({ configured, legs }: { configured: boolean; legs: Leg[] }) {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [photos, setPhotos] = useState<ReviewPhoto[]>([]);
  const [isReading, setIsReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingCount = photos.filter((photo) => ["ready", "failed"].includes(photo.status)).length;

  useEffect(() => {
    fetch("/api/photos/session", { method: "POST" })
      .then((response) => response.json() as Promise<MemberSession>)
      .then(setSession)
      .catch(() => setSession({ configured, isMember: false, label: null }));
  }, [configured]);

  const chooseFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setIsReading(true);
    const nextPhotos = await Promise.all(
      Array.from(files).map((file) => prepareReviewPhoto(file, legs)),
    );
    setPhotos((items) => [...items, ...nextPhotos]);
    setIsReading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const updatePhoto = (id: string, change: Partial<ReviewPhoto>) => {
    setPhotos((items) => items.map((item) => (item.id === id ? { ...item, ...change } : item)));
  };

  const publish = async () => {
    const candidates = photos.filter((photo) => ["ready", "failed"].includes(photo.status));

    await runWithConcurrency(candidates, 2, async (photo) => {
      updatePhoto(photo.id, { status: "uploading", statusMessage: null });

      try {
        const converted = await convertHeicIfNeeded(photo.file);
        const optimized = await imageCompression(converted, {
          fileType: "image/jpeg",
          initialQuality: 0.86,
          maxSizeMB: 2.5,
          maxWidthOrHeight: 2400,
          preserveExif: false,
          useWebWorker: true,
        });
        const dimensions = await getImageDimensions(optimized);
        const form = new FormData();
        form.set("caption", photo.caption);
        form.set("capturedAt", photo.capturedAt ?? "");
        form.set("file", optimized, `${photo.id}.jpg`);
        form.set("height", String(dimensions.height));
        form.set("legId", photo.legId);
        form.set("tripDate", photo.tripDate);
        form.set("width", String(dimensions.width));

        const response = await fetch("/api/photos", { body: form, method: "POST" });
        const result = (await response.json()) as { message?: string };

        if (response.status === 409) {
          updatePhoto(photo.id, { status: "duplicate", statusMessage: "Already in the trip" });
        } else if (!response.ok) {
          updatePhoto(photo.id, { status: "failed", statusMessage: result.message ?? "Upload failed" });
        } else {
          updatePhoto(photo.id, { status: "uploaded", statusMessage: "Published" });
        }
      } catch {
        updatePhoto(photo.id, { status: "failed", statusMessage: "Could not process this image" });
      }
    });
  };

  if (!configured) return <UploadShell><SetupState /></UploadShell>;
  if (!session) return <UploadShell><LoadingState label="Checking member access" /></UploadShell>;
  if (!session.isMember) return <UploadShell><PasswordSignIn /></UploadShell>;

  return (
    <UploadShell
      action={
        <button
          aria-label="Sign out"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] shadow-sm"
          onClick={async () => {
            await fetch("/api/photos/logout", { method: "POST" });
            window.location.reload();
          }}
          type="button"
        >
          <LogOut size={18} />
        </button>
      }
    >
      <div className="px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-muted)]">Uploads unlocked</p>
            <h2 className="mt-1 text-3xl font-semibold">Review photos</h2>
          </div>
          <button
            className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[var(--color-green)] px-4 text-sm font-bold text-white"
            onClick={() => fileInput.current?.click()}
            type="button"
          >
            <ImagePlus size={18} /> Add
          </button>
        </div>

        <input
          ref={fileInput}
          accept="image/*,.heic,.heif"
          className="hidden"
          multiple
          onChange={(event) => chooseFiles(event.target.files)}
          type="file"
        />

        {isReading && <LoadingState label="Reading photo details" compact />}

        {!isReading && photos.length === 0 && (
          <button
            className="mt-10 flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-white/20 px-8 text-center"
            onClick={() => fileInput.current?.click()}
            type="button"
          >
            <ImagePlus className="text-[var(--color-blue)]" size={36} />
            <span className="mt-4 text-xl font-semibold">Choose photos</span>
            <span className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Date and leg will be suggested from each photo.
            </span>
          </button>
        )}

        <div className="mt-6 space-y-6">
          {photos.map((photo) => (
            <ReviewCard
              key={photo.id}
              legs={legs}
              onChange={(change) => updatePhoto(photo.id, change)}
              onRemove={() => {
                URL.revokeObjectURL(photo.previewUrl);
                setPhotos((items) => items.filter((item) => item.id !== photo.id));
              }}
              photo={photo}
            />
          ))}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[440px] -translate-x-1/2 border-t border-[var(--color-border)] bg-[var(--color-app)]/96 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
          <button
            className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-green)] font-bold text-white disabled:opacity-45"
            disabled={pendingCount === 0 || photos.some((photo) => photo.status === "uploading")}
            onClick={publish}
            type="button"
          >
            <Upload size={18} />
            {pendingCount > 0 ? `Confirm and publish ${pendingCount}` : "Photos published"}
          </button>
        </div>
      )}
    </UploadShell>
  );
}

function ReviewCard({
  legs,
  onChange,
  onRemove,
  photo,
}: {
  legs: Leg[];
  onChange: (change: Partial<ReviewPhoto>) => void;
  onRemove: () => void;
  photo: ReviewPhoto;
}) {
  const locked = ["uploading", "uploaded", "duplicate"].includes(photo.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/65 bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="relative bg-stone-900">
        {/* Local object URLs cannot use the Next.js image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Photo selected for upload" className="max-h-[58vh] w-full object-contain" src={photo.previewUrl} />
        {!locked && (
          <button
            aria-label="Remove photo"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white"
            onClick={onRemove}
            type="button"
          >
            <X size={18} />
          </button>
        )}
        {photo.status !== "ready" && (
          <div className={`absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-white ${photo.status === "failed" ? "bg-red-900/90" : "bg-stone-950/75"}`}>
            {photo.status === "uploading" && <LoaderCircle className="animate-spin" size={16} />}
            {photo.status === "uploaded" && <Check size={16} />}
            {photo.status === "failed" && <RotateCcw size={16} />}
            {photo.statusMessage ?? "Uploading"}
          </div>
        )}
      </div>
      <div className="space-y-4 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">{photo.sourceLabel}</p>
        <label className="block text-sm font-bold">
          Caption
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-lg border border-white/65 bg-[var(--color-app)]/75 p-3 font-normal"
            disabled={locked}
            maxLength={PHOTO_CAPTION_LIMIT}
            onChange={(event) => onChange({ caption: event.target.value })}
            placeholder="Optional"
            value={photo.caption}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">
            Leg
            <select
              className="mt-2 h-11 w-full rounded-lg border border-white/65 bg-[var(--color-app)]/75 px-3 font-normal"
              disabled={locked}
              onChange={(event) => onChange({ legId: event.target.value })}
              value={photo.legId}
            >
              {legs.map((leg) => <option key={leg.leg_id} value={leg.leg_id}>{leg.city}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Date
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/65 bg-[var(--color-app)]/75 px-2 font-normal"
              disabled={locked}
              onChange={(event) => {
                const tripDate = event.target.value;
                const suggestedLeg = getLegForPhotoDate(legs, tripDate);
                onChange({ tripDate, ...(suggestedLeg ? { legId: suggestedLeg.leg_id } : {}) });
              }}
              type="date"
              value={photo.tripDate}
            />
          </label>
        </div>
      </div>
    </article>
  );
}

function PasswordSignIn() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const unlockUploads = async () => {
    setIsSending(true);
    setMessage(null);
    const response = await fetch("/api/photos/login", {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { message?: string };

    if (response.ok) {
      window.location.reload();
      return;
    }

    setMessage(result.message ?? "Uploads could not be unlocked.");
    setIsSending(false);
  };

  return (
    <div className="flex min-h-[72dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-blue)]"><ImagePlus size={30} /></div>
      <h2 className="mt-5 text-3xl font-semibold">Trip member access</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">Followers can view photos freely. Enter the shared trip password to add or edit them.</p>
      <label className="mt-6 block w-full max-w-sm text-left text-sm font-bold">
        Password
        <input
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-lg border border-[var(--color-border)] bg-white/45 px-4 font-normal"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <button
        className="mt-4 h-12 w-full max-w-sm rounded-lg bg-[var(--color-green)] font-bold text-white disabled:opacity-45"
        disabled={!password || isSending}
        onClick={unlockUploads}
        type="button"
      >
        {isSending ? "Checking…" : "Unlock uploads"}
      </button>
      {message && <p className="mt-4 text-sm font-semibold text-[var(--color-muted)]">{message}</p>}
    </div>
  );
}

function UploadShell({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="journal-page min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <div className="journal-app mx-auto min-h-screen w-full max-w-[440px] border-x border-black/10 bg-[var(--color-app)] shadow-2xl shadow-stone-950/25">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-app)]/95 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur">
          <Link aria-label="Back to gallery" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] shadow-sm" href="/photos"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-semibold">Add Photos</h1>
          <div className="h-10 w-10">{action}</div>
        </header>
        {children}
      </div>
    </main>
  );
}

function SetupState() {
  return (
    <div className="flex min-h-[72dvh] flex-col items-center justify-center px-8 text-center">
      <ImagePlus className="text-[var(--color-blue)]" size={38} />
      <h2 className="mt-5 text-3xl font-semibold">Photo storage is not connected yet</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">The upload experience is ready. Supabase credentials and the included migration still need to be connected once.</p>
    </div>
  );
}

function LoadingState({ compact = false, label }: { compact?: boolean; label: string }) {
  return <div className={`flex items-center justify-center gap-3 text-sm font-semibold text-[var(--color-muted)] ${compact ? "py-8" : "min-h-[72dvh]"}`}><LoaderCircle className="animate-spin" size={20} />{label}</div>;
}

async function prepareReviewPhoto(file: File, legs: Leg[]): Promise<ReviewPhoto> {
  const exifr = await import("exifr");
  let metadata: Record<string, unknown> = {};

  try {
    metadata = (await exifr.parse(file, { exif: true, gps: true, tiff: true })) ?? {};
  } catch {
    metadata = {};
  }

  const metadataDate = firstDate(metadata.DateTimeOriginal, metadata.CreateDate, metadata.ModifyDate);
  const fallbackDate = new Date(file.lastModified || Date.now());
  const captureDate = metadataDate ?? fallbackDate;
  const tripDate = toLocalDate(captureDate);
  const latitude = asNumber(metadata.latitude);
  const longitude = asNumber(metadata.longitude);
  const dateLegs = getLegsForPhotoDate(legs, tripDate);
  const gpsLeg =
    latitude !== null && longitude !== null
      ? getNearestLeg(dateLegs.length > 0 ? dateLegs : legs, latitude, longitude)
      : undefined;
  const suggestedLeg = gpsLeg ?? dateLegs.at(-1) ?? getLegForPhotoDate(legs, tripDate) ?? legs[0];
  const previewFile = await convertHeicIfNeeded(file);

  return {
    caption: "",
    capturedAt: metadataDate ? metadataDate.toISOString() : null,
    file,
    id: crypto.randomUUID(),
    legId: suggestedLeg?.leg_id ?? "",
    previewUrl: URL.createObjectURL(previewFile),
    sourceLabel: metadataDate
      ? dateLegs.length > 1
        ? gpsLeg
          ? "Transition day · suggested from photo date and location"
          : "Transition day · please confirm the leg"
        : gpsLeg
          ? "Suggested from photo date and location"
          : "Suggested from photo date"
      : "Date estimated from file · please confirm",
    status: "ready",
    statusMessage: null,
    tripDate,
  };
}

async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) return file;

  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({ blob: file, quality: 0.9, toType: "image/jpeg" });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
}

function firstDate(...values: unknown[]): Date | null {
  return values.find((value): value is Date => value instanceof Date && !Number.isNaN(value.valueOf())) ?? null;
}

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNearestLeg(legs: Leg[], latitude: number, longitude: number): Leg | undefined {
  return legs
    .filter((leg) => leg.latitude !== null && leg.longitude !== null)
    .map((leg) => ({ leg, distance: distanceSquared(latitude, longitude, leg.latitude ?? 0, leg.longitude ?? 0) }))
    .sort((a, b) => a.distance - b.distance)[0]?.leg;
}

function getLegsForPhotoDate(legs: Leg[], date: string): Leg[] {
  return legs.filter((leg) => leg.leave === date || (date >= leg.arrive && date < leg.leave));
}

function distanceSquared(latA: number, lonA: number, latB: number, lonB: number): number {
  const longitudeScale = Math.cos(((latA + latB) / 2) * (Math.PI / 180));
  return (latA - latB) ** 2 + ((lonA - lonB) * longitudeScale) ** 2;
}

async function getImageDimensions(file: File): Promise<{ height: number; width: number }> {
  const bitmap = await createImageBitmap(file);
  const dimensions = { height: bitmap.height, width: bitmap.width };
  bitmap.close();
  return dimensions;
}

async function runWithConcurrency<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let index = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      if (item) await task(item);
    }
  });

  await Promise.all(workers);
}
