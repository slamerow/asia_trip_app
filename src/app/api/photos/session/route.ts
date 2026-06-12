import { NextResponse } from "next/server";
import { getPhotoMember } from "@/lib/photo-auth";
import { isPhotoFeatureConfigured } from "@/lib/supabase/config";

export async function GET() {
  const member = await getPhotoMember();

  return NextResponse.json({
    configured: isPhotoFeatureConfigured(),
    email: member?.email ?? null,
    isMember: Boolean(member),
  });
}
