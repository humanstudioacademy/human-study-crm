import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";

export default async function KanbanIndexPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id")
    .order("is_default", { ascending: false })
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!pipeline) {
    if (user.profile.role === "admin") redirect("/admin/pipelines");
    return (
      <div className="mx-auto max-w-md space-y-2 p-8 text-center">
        <h1 className="text-xl font-semibold">Nenhuma pipeline configurada</h1>
        <p className="text-sm text-muted-foreground">
          Peça a um administrador para criar a primeira pipeline em
          Admin → Pipelines.
        </p>
      </div>
    );
  }

  redirect(`/kanban/${pipeline.id}`);
}
