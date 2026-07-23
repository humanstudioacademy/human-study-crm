import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PipelineTabs } from "./pipeline-tabs";
import { KanbanBoardLoader } from "@/components/kanban/kanban-board-loader";

export default async function KanbanPipelinePage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  const supabase = await createClient();

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id, nome")
    .eq("id", pipelineId)
    .single();

  if (!pipeline) notFound();

  const [{ data: pipelines }, { data: etapas }, { data: negocios }, { data: clientes }] =
    await Promise.all([
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
    ]);

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b p-4">
        <h1 className="mb-3 text-2xl font-semibold">Kanban</h1>
        <PipelineTabs pipelines={pipelines ?? []} currentId={pipeline.id} />
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoardLoader
          pipelineId={pipeline.id}
          etapas={etapas ?? []}
          negocios={negocios ?? []}
          clientes={clientes ?? []}
        />
      </div>
    </div>
  );
}
