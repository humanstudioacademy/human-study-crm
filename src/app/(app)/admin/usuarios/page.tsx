import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsuariosTable } from "./usuarios-table";

export default async function UsuariosPage() {
  const currentUser = await requireAdmin();
  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Convide o time comercial. Não existe cadastro público — só você
            cria as contas.
          </p>
        </div>
        <InviteUserDialog />
      </div>

      <UsuariosTable usuarios={usuarios ?? []} currentUserId={currentUser.id} />
    </div>
  );
}
