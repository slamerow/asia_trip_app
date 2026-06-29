import { PhotoGallery } from "@/components/photo-gallery";
import { getPublishedPhotosResult } from "@/lib/photo-data";
import { isPhotoFeatureConfigured } from "@/lib/supabase/config";
import { getTripData } from "@/lib/trip-data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ date?: string; leg?: string }>;
};

export default async function PhotosPage({ searchParams }: PageProps) {
  const [{ date, leg }, tripData] = await Promise.all([searchParams, getTripData()]);
  const filter = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date : undefined,
    legId: tripData.legs.some((item) => item.leg_id === leg) ? leg : undefined,
  };
  const photoResult = await getPublishedPhotosResult(filter);

  return (
    <PhotoGallery
      configured={isPhotoFeatureConfigured()}
      filter={filter}
      legs={tripData.legs}
      loadStatus={photoResult.status}
      loadStatusMessage={photoResult.status === "unavailable" ? photoResult.message : null}
      photos={photoResult.photos}
    />
  );
}
