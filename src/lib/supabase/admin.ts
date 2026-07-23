import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Client com a service role (SUPABASE_SECRET_KEY) — ignora RLS.
// Nunca importar isto de um Client Component; use só em Server Actions/Route Handlers,
// e só para operações que exigem privilégio de admin (ex: auth.admin.inviteUserByEmail).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
