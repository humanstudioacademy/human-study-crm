"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export type ActionState = { error?: string; success?: boolean } | undefined;

const pipelineSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da pipeline."),
});

export async function createPipeline(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = pipelineSchema.safeParse({ nome: formData.get("nome") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipelines")
    .insert({ nome: parsed.data.nome })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar a pipeline." };
  }

  revalidatePath("/admin/pipelines");
  redirect(`/admin/pipelines/${data.id}`);
}

export async function renamePipeline(
  pipelineId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = pipelineSchema.safeParse({ nome: formData.get("nome") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pipelines")
    .update({ nome: parsed.data.nome })
    .eq("id", pipelineId);

  if (error) return { error: "Não foi possível renomear a pipeline." };

  revalidatePath("/admin/pipelines");
  revalidatePath(`/admin/pipelines/${pipelineId}`);
  return { success: true };
}

export async function deletePipeline(pipelineId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("pipelines")
    .delete()
    .eq("id", pipelineId);

  if (error) {
    return {
      error:
        "Não é possível excluir: existem negócios usando esta pipeline. Mova ou encerre-os primeiro.",
    };
  }

  revalidatePath("/admin/pipelines");
  redirect("/admin/pipelines");
}

const etapaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da etapa."),
  probabilidade_conversao: z.coerce.number().min(0).max(100),
  is_won_stage: z.coerce.boolean().optional().default(false),
  is_lost_stage: z.coerce.boolean().optional().default(false),
});

export async function createEtapa(
  pipelineId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = etapaSchema.safeParse({
    nome: formData.get("nome"),
    probabilidade_conversao: formData.get("probabilidade_conversao"),
    is_won_stage: formData.get("is_won_stage") === "on",
    is_lost_stage: formData.get("is_lost_stage") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("etapas")
    .select("posicao")
    .eq("pipeline_id", pipelineId)
    .order("posicao", { ascending: false })
    .limit(1);

  const nextPosicao = (existing?.[0]?.posicao ?? -1) + 1;

  const { error } = await supabase.from("etapas").insert({
    pipeline_id: pipelineId,
    posicao: nextPosicao,
    ...parsed.data,
  });

  if (error) return { error: "Não foi possível criar a etapa." };

  revalidatePath(`/admin/pipelines/${pipelineId}`);
  return { success: true };
}

export async function updateEtapa(
  etapaId: string,
  pipelineId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = etapaSchema.safeParse({
    nome: formData.get("nome"),
    probabilidade_conversao: formData.get("probabilidade_conversao"),
    is_won_stage: formData.get("is_won_stage") === "on",
    is_lost_stage: formData.get("is_lost_stage") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("etapas")
    .update(parsed.data)
    .eq("id", etapaId);

  if (error) return { error: "Não foi possível atualizar a etapa." };

  revalidatePath(`/admin/pipelines/${pipelineId}`);
  return { success: true };
}

export async function deleteEtapa(etapaId: string, pipelineId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("etapas").delete().eq("id", etapaId);

  if (error) {
    return {
      error:
        "Não é possível excluir: existem negócios nesta etapa. Mova-os primeiro.",
    };
  }

  revalidatePath(`/admin/pipelines/${pipelineId}`);
  return { success: true };
}

export async function reorderEtapas(
  pipelineId: string,
  orderedIds: string[]
) {
  await requireAdmin();
  const supabase = await createClient();

  // Duas passadas: primeiro empurra posições para uma faixa alta e livre de
  // colisão com a unique(pipeline_id, posicao), depois grava a ordem final.
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("etapas")
        .update({ posicao: 1000 + index })
        .eq("id", id)
    )
  );

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("etapas").update({ posicao: index }).eq("id", id)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { error: "Não foi possível reordenar as etapas." };
  }

  revalidatePath(`/admin/pipelines/${pipelineId}`);
  return { success: true };
}
