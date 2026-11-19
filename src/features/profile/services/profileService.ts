import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/lib/database.types";

export type ProfileDraft = Pick<ProfileRow, "display_name" | "target_role">;

export async function loadProfile(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, target_role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  if (data) return data;

  const { data: created, error: createError } = await client
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id" })
    .select("id, display_name, target_role, created_at, updated_at")
    .single();

  if (createError) throw new Error(`Could not initialize your profile: ${createError.message}`);
  return created;
}

export async function saveProfile(
  client: SupabaseClient<Database>,
  userId: string,
  draft: ProfileDraft,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from("profiles")
    .upsert({
      id: userId,
      display_name: draft.display_name.trim(),
      target_role: draft.target_role.trim(),
    }, { onConflict: "id" })
    .select("id, display_name, target_role, created_at, updated_at")
    .single();

  if (error) throw new Error(`Could not save your profile: ${error.message}`);
  return data;
}
