import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Tables<"profiles">;
};

// Memoizado por request: várias chamadas na mesma árvore de render reaproveitam o resultado.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) return null;

  return { id: user.id, email: user.email ?? profile.email, profile };
});

// Para Server Components/Actions que exigem sessão válida.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
