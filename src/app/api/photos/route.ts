import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPhotoMember } from "@/lib/photo-auth";
import { getPublishedPhotosResult } from "@/lib/photo-data";
import { PHOTO_BUCKET, PHOTO_CAPTION_LIMIT, PHOTO_TRIP_ID } from "@/lib/photos";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getTripData } from "@/lib/trip-data";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const leg = searchParams.get("leg");
  const filter = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date ?? undefined : undefined,
    legId: /^[a-z0-9-]+$/.test(leg ?? "") ? leg ?? undefined : undefined,
  };
  const result = await getPublishedPhotosResult(filter);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
    status: result.status === "ready" ? 200 : 503,
  });
}

export async function POST(request: Request) {
  const member = await getPhotoMember();

  if (!member) {
    return NextResponse.json({ message: "Trip member sign-in required." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Photo storage is not configured." }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const tripDate = getString(form, "tripDate");
  const legId = getString(form, "legId");
  const caption = getString(form, "caption").trim();
  const capturedAt = getString(form, "capturedAt") || null;
  const width = Number(getString(form, "width"));
  const height = Number(getString(form, "height"));

  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ message: "Choose a supported image under 8 MB." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate) || caption.length > PHOTO_CAPTION_LIMIT) {
    return NextResponse.json({ message: "Photo details are invalid." }, { status: 400 });
  }

  const tripData = await getTripData();
  const leg = tripData.legs.find((item) => item.leg_id === legId);

  if (!leg || !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return NextResponse.json({ message: "Photo assignment is invalid." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  const { data: duplicate } = await supabase
    .from("trip_photos")
    .select("photo_id")
    .eq("trip_id", PHOTO_TRIP_ID)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { duplicatePhotoId: duplicate.photo_id, message: "This photo is already in the trip." },
      { status: 409 },
    );
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `${PHOTO_TRIP_ID}/${legId}/${tripDate}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ message: "Photo upload failed." }, { status: 502 });
  }

  const { data, error: insertError } = await supabase
    .from("trip_photos")
    .insert({
      caption: caption || null,
      captured_at: capturedAt,
      content_hash: contentHash,
      height,
      leg_id: legId,
      storage_path: storagePath,
      trip_date: tripDate,
      trip_id: PHOTO_TRIP_ID,
      uploaded_by: member.id,
      uploader_email: member.label,
      width,
    })
    .select("photo_id")
    .single();

  if (insertError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    return NextResponse.json({ message: "Photo details could not be saved." }, { status: 502 });
  }

  return NextResponse.json({ photoId: data.photo_id }, { status: 201 });
}

function getString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
