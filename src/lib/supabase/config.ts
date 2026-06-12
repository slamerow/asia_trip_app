export function isPhotoFeatureConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabasePublicConfig(): { key: string; url: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return url && key ? { key, url } : null;
}

export function getPhotoMemberEmails(): string[] {
  return (process.env.PHOTO_MEMBER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPhotoMemberEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getPhotoMemberEmails().includes(email.trim().toLowerCase());
}
