import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
import { PipelineTabs } from "./pipeline-tabs";
import { KanbanBoardLoader } from "@/components/kanban/kanban-board-loader";

export default async function KanbanPipelinePage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id, nome")
    .eq("id", pipelineId)
    .single();

  if (!pipeline) notFound();

  const [
    { data: pipelines },
    { data: etapas },
    { data: negocios },
    { data: clientes },
    { data: transicoesRaw },
  ] = await Promise.all([
    supabase.from("pipelines").select("id, nome").order("created_at"),
    supabase
      .from("etapas")
      .select("*")
      .eq("pipeline_id", pipelineId)
      .order("posicao"),
    supabase
      .from("negocios")
      .select(
        "id, titulo, valor, status, etapa_id, stage_entered_at, utm_source, cliente:clientes(nome), owner:profiles!negocios_owner_id_fkey(full_name)"
      )
      .eq("pipeline_id", pipelineId)
      .order("created_at", { ascending: false }),
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase
      .from("etapa_transicoes")
      .select("etapa_origem_id, etapa_destino_id"),
  ]);

  const transicoes: Record<string, string[]> = {};
  for (const t of transicoesRaw ?? []) {
    (transicoes[t.etapa_origem_id] ??= []).push(t.etapa_destino_id);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b p-4">
        <h1 className="mb-3 text-2xl font-semibold">Kanban</h1>
        <PipelineTabs pipelines={pipelines ?? []} currentId={pipeline.id} />
      </div>
      <div className="min-h-0 flex-1">
        <KanbanBoardLoader
          pipelineId={pipeline.id}
          etapas={etapas ?? []}
          negocios={negocios ?? []}
          clientes={clientes ?? []}
          transicoes={transicoes}
          isAdmin={user.profile.role === "admin"}
        />
      </div>
    </div>
  );
}
