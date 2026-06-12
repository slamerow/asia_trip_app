import { PhotoGallery } from "@/components/photo-gallery";
import { getPublishedPhotos } from "@/lib/photo-data";
import { isPhotoFeatureConfigured } from "@/lib/supabase/config";
import { getTripData } from "@/lib/trip-data";

type PageProps = {
  searchParams: Promise<{ date?: string; leg?: string }>;
};

export default async function PhotosPage({ searchParams }: PageProps) {
  const [{ date, leg }, tripData] = await Promise.all([searchParams, getTripData()]);
  const filter = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date : undefined,
    legId: tripData.legs.some((item) => item.leg_id === leg) ? leg : undefined,
  };
  const photos = await getPublishedPhotos(filter);

  return (
    <PhotoGallery
      configured={isPhotoFeatureConfigured()}
      filter={filter}
      legs={tripData.legs}
      photos={photos}
    />
  );
}
