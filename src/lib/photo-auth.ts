import type { User } from "@supabase/supabase-js";
import { isPhotoMemberEmail } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPhotoMember(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user && isPhotoMemberEmail(user.email) ? user : null;
}
