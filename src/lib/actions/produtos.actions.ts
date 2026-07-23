"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionState } from "@/lib/actions/pipelines.actions";

const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto."),
  descricao: z.string().trim().optional(),
});

export async function createProduto(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar o produto." };

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${data.id}`);
}

export async function updateProduto(
  produtoId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("produtos")
    .update({
      ...parsed.data,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", produtoId);

  if (error) return { error: "Não foi possível atualizar o produto." };

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${produtoId}`);
  return { success: true };
}

const ofertaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da oferta."),
  preco_atual: z.coerce.number().min(0, "O preço não pode ser negativo."),
});

export async function createOferta(
  produtoId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = ofertaSchema.safeParse({
    nome: formData.get("nome"),
    preco_atual: formData.get("preco_atual"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("ofertas").insert({
    produto_id: produtoId,
    ...parsed.data,
  });

  if (error) return { error: "Não foi possível criar a oferta." };

  revalidatePath(`/admin/produtos/${produtoId}`);
  return { success: true };
}

const ofertaInfoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da oferta."),
});

export async function updateOfertaInfo(
  ofertaId: string,
  produtoId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = ofertaInfoSchema.safeParse({ nome: formData.get("nome") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ofertas")
    .update({
      nome: parsed.data.nome,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", ofertaId);

  if (error) return { error: "Não foi possível atualizar a oferta." };

  revalidatePath(`/admin/produtos/${produtoId}`);
  return { success: true };
}

const precoSchema = z.object({
  novo_preco: z.coerce.number().min(0, "O preço não pode ser negativo."),
});

export async function changeOfertaPreco(
  ofertaId: string,
  produtoId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = precoSchema.safeParse({ novo_preco: formData.get("novo_preco") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_oferta_preco", {
    p_oferta_id: ofertaId,
    p_novo_preco: parsed.data.novo_preco,
  });

  if (error) return { error: "Não foi possível atualizar o preço." };

  revalidatePath(`/admin/produtos/${produtoId}`);
  return { success: true };
}
