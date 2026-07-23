import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioEditor } from "./formulario-editor";

export default async function FormularioDetailPage({
  params,
}: {
  params: Promise<{ formularioId: string }>;
}) {
  const { formularioId } = await params;
  const supabase = await createClient();

  const { data: formulario } = await supabase
    .from("formularios")
    .select("*")
    .eq("id", formularioId)
    .single();

  if (!formulario) notFound();

  const [{ data: pipelines }, { data: usuarios }, { data: campos }, { data: submissoes }] =
    await Promise.all([
      supabase
        .from("pipelines")
        .select("id, nome, etapas(id, nome, posicao)")
        .order("nome"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("formulario_campos")
        .select("*")
        .eq("formulario_id", formularioId)
        .order("posicao"),
      supabase
        .from("formulario_submissoes")
        .select("*, cliente:clientes(nome), negocio:negocios(id, titulo)")
        .eq("formulario_id", formularioId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <FormularioEditor
      formulario={formulario}
      pipelines={(pipelines ?? []).map((p) => ({
        ...p,
        etapas: [...(p.etapas ?? [])].sort((a, b) => a.posicao - b.posicao),
      }))}
      usuarios={usuarios ?? []}
      campos={campos ?? []}
      submissoes={submissoes ?? []}
    />
  );
}
