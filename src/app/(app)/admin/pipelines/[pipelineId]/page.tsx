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

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <PipelineEditor pipeline={pipeline} etapas={etapas ?? []} />
    </div>
  );
}
