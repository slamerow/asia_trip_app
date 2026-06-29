import { PHOTO_BUCKET, PHOTO_TRIP_ID, type PhotoFilter, type TripPhoto } from "@/lib/photos";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type PhotoRow = {
  caption: string | null;
  captured_at: string | null;
  height: number;
  leg_id: string;
  photo_id: string;
  published_at: string;
  storage_path: string;
  trip_date: string;
  uploader_email: string;
  width: number;
};

export type PublishedPhotosResult =
  | {
      photos: TripPhoto[];
      status: "ready";
    }
  | {
      message: string;
      photos: TripPhoto[];
      status: "unavailable";
    };

export async function getPublishedPhotos(filter: PhotoFilter = {}): Promise<TripPhoto[]> {
  const result = await getPublishedPhotosResult(filter);
  return result.photos;
}

export async function getPublishedPhotosResult(
  filter: PhotoFilter = {},
): Promise<PublishedPhotosResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) return { photos: [], status: "ready" };

  const client = supabase;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { data, error } = await fetchPhotoRows(filter);

    if (!error) {
      return {
        photos: (data as PhotoRow[]).map(mapPhotoRow),
        status: "ready",
      };
    }

    lastError = error.message;
    if (attempt < 3) await wait(attempt * 250);
  }

  console.error("Could not load trip photos", lastError);

  return {
    message: "Photos are still loading. Keep this page open.",
    photos: [],
    status: "unavailable",
  };

  function fetchPhotoRows(currentFilter: PhotoFilter) {
    let query = client
      .from("trip_photos")
      .select(
        "photo_id, storage_path, captured_at, trip_date, leg_id, caption, width, height, published_at, uploader_email",
      )
      .eq("trip_id", PHOTO_TRIP_ID);

    if (currentFilter.date) query = query.eq("trip_date", currentFilter.date);
    if (currentFilter.legId) query = query.eq("leg_id", currentFilter.legId);

    query = currentFilter.legId
      ? query.order("trip_date", { ascending: true }).order("captured_at", { ascending: true })
      : query.order("trip_date", { ascending: false }).order("captured_at", { ascending: false });

    return query;
  }

  function mapPhotoRow(row: PhotoRow): TripPhoto {
    const { data: publicUrl } = client.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path);

    return {
      caption: row.caption,
      capturedAt: row.captured_at,
      height: row.height,
      legId: row.leg_id,
      photoId: row.photo_id,
      publishedAt: row.published_at,
      tripDate: row.trip_date,
      uploaderEmail: row.uploader_email,
      url: publicUrl.publicUrl,
      width: row.width,
    };
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
