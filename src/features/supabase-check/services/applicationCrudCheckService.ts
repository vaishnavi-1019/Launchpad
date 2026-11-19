import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationRow, Database } from "@/lib/database.types";

export type CrudCheckApplication = Pick<
  ApplicationRow,
  "id" | "company" | "role" | "status" | "created_at"
>;

const TEST_COMPANY_PREFIX = "Launchpad CRUD Test -";

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listCrudCheckApplications(
  client: SupabaseClient<Database>,
): Promise<CrudCheckApplication[]> {
  const { data, error } = await client
    .from("applications")
    .select("id, company, role, status, created_at")
    .like("company", `${TEST_COMPANY_PREFIX}%`)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createCrudCheckApplication(
  client: SupabaseClient<Database>,
): Promise<CrudCheckApplication> {
  const { data: userData, error: userError } = await client.auth.getUser();
  throwIfError(userError);
  if (!userData.user) throw new Error("Sign in before creating a test application.");

  const suffix = crypto.randomUUID().slice(0, 8);
  const { data, error } = await client
    .from("applications")
    .insert({
      user_id: userData.user.id,
      company: `${TEST_COMPANY_PREFIX} ${suffix}`,
      role: "Connection verification",
      status: "wishlist",
      tags: ["supabase-crud-test"],
      activity: [],
    })
    .select("id, company, role, status, created_at")
    .single();

  throwIfError(error);
  if (!data) throw new Error("Supabase did not return the inserted test application.");
  return data;
}

export async function updateCrudCheckApplication(
  client: SupabaseClient<Database>,
  id: string,
): Promise<CrudCheckApplication> {
  const { data, error } = await client
    .from("applications")
    .update({ role: "Connection verified" })
    .eq("id", id)
    .like("company", `${TEST_COMPANY_PREFIX}%`)
    .select("id, company, role, status, created_at")
    .single();

  throwIfError(error);
  if (!data) throw new Error("Supabase did not return the updated test application.");
  return data;
}

export async function deleteCrudCheckApplication(
  client: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { data, error } = await client
    .from("applications")
    .delete()
    .eq("id", id)
    .like("company", `${TEST_COMPANY_PREFIX}%`)
    .select("id")
    .single();

  throwIfError(error);
  if (!data) throw new Error("Supabase did not confirm deletion of the test application.");
}
