"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionState } from "@/lib/actions/pipelines.actions";

const negocioSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título do negócio."),
  cliente_id: z.string().uuid("Selecione um cliente."),
  etapa_id: z.string().uuid("Selecione uma etapa."),
  valor: z.coerce.number().min(0).default(0),
  utm_source: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional(),
  utm_medium: z.string().trim().optional(),
  utm_term: z.string().trim().optional(),
  utm_content: z.string().trim().optional(),
});

export async function createNegocio(
  pipelineId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = negocioSchema.safeParse({
    titulo: formData.get("titulo"),
    cliente_id: formData.get("cliente_id"),
    etapa_id: formData.get("etapa_id"),
    valor: formData.get("valor") || 0,
    utm_source: formData.get("utm_source") || undefined,
    utm_campaign: formData.get("utm_campaign") || undefined,
    utm_medium: formData.get("utm_medium") || undefined,
    utm_term: formData.get("utm_term") || undefined,
    utm_content: formData.get("utm_content") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("negocios").insert({
    ...parsed.data,
    pipeline_id: pipelineId,
    owner_id: user.id,
    created_by: user.id,
  });

  if (error) return { error: "Não foi possível criar o negócio." };

  revalidatePath(`/kanban/${pipelineId}`);
  return { success: true };
}

export async function moveNegocioEtapa(
  negocioId: string,
  novaEtapaId: string,
  pipelineId: string
) {
  await requireUser();
  const supabase = await createClient();

  const { data: etapa } = await supabase
    .from("etapas")
    .select("is_won_stage, is_lost_stage")
    .eq("id", novaEtapaId)
    .single();

  const status = etapa?.is_won_stage
    ? "won"
    : etapa?.is_lost_stage
      ? "lost"
      : "open";

  const { error } = await supabase
    .from("negocios")
    .update({ etapa_id: novaEtapaId, status })
    .eq("id", negocioId);

  if (error) return { error: "Não foi possível mover o negócio." };

  revalidatePath(`/kanban/${pipelineId}`);
  return { success: true };
}

const editNegocioSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título do negócio."),
  descricao: z.string().trim().optional(),
  valor: z.coerce.number().min(0),
  status: z.enum(["open", "won", "lost"]),
  utm_source: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional(),
  utm_medium: z.string().trim().optional(),
  utm_term: z.string().trim().optional(),
  utm_content: z.string().trim().optional(),
});

export async function updateNegocio(
  negocioId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = editNegocioSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    valor: formData.get("valor"),
    status: formData.get("status"),
    utm_source: formData.get("utm_source") || undefined,
    utm_campaign: formData.get("utm_campaign") || undefined,
    utm_medium: formData.get("utm_medium") || undefined,
    utm_term: formData.get("utm_term") || undefined,
    utm_content: formData.get("utm_content") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("negocios")
    .update(parsed.data)
    .eq("id", negocioId);

  if (error) return { error: "Não foi possível atualizar o negócio." };

  revalidatePath(`/negocios/${negocioId}`);
  return { success: true };
}

export async function deleteNegocio(negocioId: string, pipelineId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("negocios").delete().eq("id", negocioId);

  if (error) return { error: "Não foi possível excluir o negócio." };

  revalidatePath(`/kanban/${pipelineId}`);
  redirect(`/kanban/${pipelineId}`);
}

const notaSchema = z.object({
  texto: z.string().trim().min(1, "Escreva uma nota antes de salvar."),
});

export async function addNota(
  negocioId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = notaSchema.safeParse({ texto: formData.get("texto") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("negocio_historico").insert({
    negocio_id: negocioId,
    tipo: "nota",
    autor_id: user.id,
    descricao: parsed.data.texto,
  });

  if (error) return { error: "Não foi possível salvar a nota." };

  revalidatePath(`/negocios/${negocioId}`);
  return { success: true };
}

const addOfertaSchema = z.object({
  oferta_id: z.string().uuid("Selecione uma oferta."),
  quantidade: z.coerce.number().int().min(1).default(1),
});

export async function addOfertaToNegocio(
  negocioId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = addOfertaSchema.safeParse({
    oferta_id: formData.get("oferta_id"),
    quantidade: formData.get("quantidade") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();

  const { data: oferta } = await supabase
    .from("ofertas")
    .select("preco_atual")
    .eq("id", parsed.data.oferta_id)
    .single();

  if (!oferta) return { error: "Oferta não encontrada." };

  const { error } = await supabase.from("negocio_ofertas").insert({
    negocio_id: negocioId,
    oferta_id: parsed.data.oferta_id,
    quantidade: parsed.data.quantidade,
    preco_unitario_snapshot: oferta.preco_atual,
  });

  if (error) {
    return {
      error: "Não foi possível adicionar a oferta (talvez já esteja associada).",
    };
  }

  revalidatePath(`/negocios/${negocioId}`);
  return { success: true };
}

export async function removeOfertaFromNegocio(
  negocioOfertaId: string,
  negocioId: string
) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("negocio_ofertas")
    .delete()
    .eq("id", negocioOfertaId);

  if (error) return { error: "Não foi possível remover a oferta." };

  revalidatePath(`/negocios/${negocioId}`);
  return { success: true };
}
