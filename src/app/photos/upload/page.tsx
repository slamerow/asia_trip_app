import { PhotoUpload } from "@/components/photo-upload";
import { isPhotoFeatureConfigured } from "@/lib/supabase/config";
import { getTripData } from "@/lib/trip-data";

export default async function PhotoUploadPage() {
  const tripData = await getTripData();

  return <PhotoUpload configured={isPhotoFeatureConfigured()} legs={tripData.legs} />;
}
