import { createClient } from "@/lib/supabase/server";
import { NovoFormularioForm } from "./novo-formulario-form";

export default async function NovoFormularioPage() {
  const supabase = await createClient();
  const [{ data: pipelines }, { data: usuarios }] = await Promise.all([
    supabase
      .from("pipelines")
      .select("id, nome, etapas(id, nome, posicao)")
      .order("nome"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Novo formulário</h1>
        <p className="text-sm text-muted-foreground">
          Depois de criar, adicione os campos e compartilhe o link público.
        </p>
      </div>
      <NovoFormularioForm
        pipelines={(pipelines ?? []).map((p) => ({
          ...p,
          etapas: [...(p.etapas ?? [])].sort((a, b) => a.posicao - b.posicao),
        }))}
        usuarios={usuarios ?? []}
      />
    </div>
  );
}
