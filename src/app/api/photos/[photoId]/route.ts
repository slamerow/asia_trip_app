import { NextResponse } from "next/server";
import { getPhotoMember } from "@/lib/photo-auth";
import { deletePhotoSafely } from "@/lib/photo-delete";
import { PHOTO_BUCKET, PHOTO_CAPTION_LIMIT, PHOTO_TRIP_ID } from "@/lib/photos";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getTripData } from "@/lib/trip-data";

type RouteProps = {
  params: Promise<{ photoId: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const member = await getPhotoMember();

  if (!member) return NextResponse.json({ message: "Trip member sign-in required." }, { status: 401 });

  const { photoId } = await params;
  const body = await readPhotoDetails(request);
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const legId = typeof body.legId === "string" ? body.legId : "";
  const tripDate = typeof body.tripDate === "string" ? body.tripDate : "";

  if (caption.length > PHOTO_CAPTION_LIMIT || !/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    return NextResponse.json({ message: "Photo details are invalid." }, { status: 400 });
  }

  const tripData = await getTripData();

  if (!tripData.legs.some((leg) => leg.leg_id === legId)) {
    return NextResponse.json({ message: "Choose a valid trip leg." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) return NextResponse.json({ message: "Photo storage is not configured." }, { status: 503 });

  const { data: updatedPhoto, error } = await supabase
    .from("trip_photos")
    .update({ caption: caption || null, leg_id: legId, trip_date: tripDate })
    .eq("trip_id", PHOTO_TRIP_ID)
    .eq("photo_id", photoId)
    .select("photo_id")
    .maybeSingle();

  if (error) return NextResponse.json({ message: "Photo could not be updated." }, { status: 502 });
  if (!updatedPhoto) return NextResponse.json({ message: "Photo not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const member = await getPhotoMember();

  if (!member) return NextResponse.json({ message: "Trip member sign-in required." }, { status: 401 });

  const { photoId } = await params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) return NextResponse.json({ message: "Photo storage is not configured." }, { status: 503 });

  const { data: photo, error: findError } = await supabase
    .from("trip_photos")
    .select("storage_path")
    .eq("trip_id", PHOTO_TRIP_ID)
    .eq("photo_id", photoId)
    .single();

  if (findError || !photo) return NextResponse.json({ message: "Photo not found." }, { status: 404 });

  const result = await deletePhotoSafely({
    deleteFile: async () => {
      const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
      return !error;
    },
    deleteRecord: async () => {
      const { error } = await supabase
        .from("trip_photos")
        .delete()
        .eq("trip_id", PHOTO_TRIP_ID)
        .eq("photo_id", photoId);
      return !error;
    },
  });

  if (result.status === "record_delete_failed") {
    return NextResponse.json({ message: "Photo record could not be deleted." }, { status: 502 });
  }

  if (result.status === "deleted_with_orphaned_file") {
    console.error("Photo record deleted but storage cleanup failed", {
      photoId,
      storagePath: photo.storage_path,
    });
  }

  return NextResponse.json({ ok: true });
}

async function readPhotoDetails(request: Request): Promise<{
  caption?: unknown;
  legId?: unknown;
  tripDate?: unknown;
}> {
  try {
    return (await request.json()) as { caption?: unknown; legId?: unknown; tripDate?: unknown };
  } catch {
    return {};
  }
}
