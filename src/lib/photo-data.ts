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

export async function getPublishedPhotos(filter: PhotoFilter = {}): Promise<TripPhoto[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) return [];

  let query = supabase
    .from("trip_photos")
    .select(
      "photo_id, storage_path, captured_at, trip_date, leg_id, caption, width, height, published_at, uploader_email",
    )
    .eq("trip_id", PHOTO_TRIP_ID);

  if (filter.date) query = query.eq("trip_date", filter.date);
  if (filter.legId) query = query.eq("leg_id", filter.legId);

  query = filter.legId
    ? query.order("trip_date", { ascending: true }).order("captured_at", { ascending: true })
    : query.order("trip_date", { ascending: false }).order("captured_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Could not load trip photos", error.message);
    return [];
  }

  return (data as PhotoRow[]).map((row) => {
    const { data: publicUrl } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path);

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
  });
}
