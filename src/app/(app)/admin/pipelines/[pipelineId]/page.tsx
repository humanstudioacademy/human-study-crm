import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PipelineEditor } from "./pipeline-editor";

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  const supabase = await createClient();

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", pipelineId)
    .single();

  if (!pipeline) notFound();

  const { data: etapas } = await supabase
    .from("etapas")
    .select("*")
    .eq("pipeline_id", pipelineId)
    .order("posicao");

  const etapaIds = (etapas ?? []).map((e) => e.id);
  const { data: transicoesRaw } = await supabase
    .from("etapa_transicoes")
    .select("etapa_origem_id, etapa_destino_id")
    .in("etapa_origem_id", etapaIds.length > 0 ? etapaIds : [""]);

  const transicoes: Record<string, string[]> = {};
  for (const t of transicoesRaw ?? []) {
    (transicoes[t.etapa_origem_id] ??= []).push(t.etapa_destino_id);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <PipelineEditor
        pipeline={pipeline}
        etapas={etapas ?? []}
        transicoes={transicoes}
      />
    </div>
  );
}
