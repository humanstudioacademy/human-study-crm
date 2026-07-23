"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
import { generateClienteAnalise } from "@/lib/ai/insights";
import type { ActionState } from "@/lib/actions/pipelines.actions";

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().trim().optional(),
  empresa: z.string().trim().optional(),
  cargo: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

function parseClienteForm(formData: FormData) {
  return clienteSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email") || "",
    telefone: formData.get("telefone") || undefined,
    empresa: formData.get("empresa") || undefined,
    cargo: formData.get("cargo") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });
}

export async function createCliente(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseClienteForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      ...parsed.data,
      email: parsed.data.email || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar o cliente." };

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

// Igual ao createCliente, mas sem redirect — usado em diálogos "criar cliente
// rápido" embutidos em outros fluxos (ex: criação de negócio).
export async function createClienteInline(
  _prevState: ActionState,
  formData: FormData
): Promise<(ActionState & { clienteId?: string; clienteNome?: string })> {
  const user = await requireUser();
  const parsed = parseClienteForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      ...parsed.data,
      email: parsed.data.email || null,
      created_by: user.id,
    })
    .select("id, nome")
    .single();

  if (error || !data) return { error: "Não foi possível criar o cliente." };

  revalidatePath("/clientes");
  return { success: true, clienteId: data.id, clienteNome: data.nome };
}

const telefoneSchema = z.object({
  numero: z.string().trim().min(1, "Informe o número."),
  tipo: z.enum(["celular", "fixo", "whatsapp"]).default("celular"),
});

export async function addTelefone(
  clienteId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = telefoneSchema.safeParse({
    numero: formData.get("numero"),
    tipo: formData.get("tipo") || "celular",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("cliente_telefones").insert({
    cliente_id: clienteId,
    ...parsed.data,
  });

  if (error) return { error: "Não foi possível adicionar o telefone." };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true };
}

export async function removeTelefone(telefoneId: string, clienteId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cliente_telefones")
    .delete()
    .eq("id", telefoneId);

  if (error) return { error: "Não foi possível remover o telefone." };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true };
}

const enderecoSchema = z.object({
  label: z.string().trim().optional(),
  logradouro: z.string().trim().optional(),
  numero: z.string().trim().optional(),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().optional(),
  cep: z.string().trim().optional(),
});

export async function addEndereco(
  clienteId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = enderecoSchema.safeParse({
    label: formData.get("label") || undefined,
    logradouro: formData.get("logradouro") || undefined,
    numero: formData.get("numero") || undefined,
    complemento: formData.get("complemento") || undefined,
    bairro: formData.get("bairro") || undefined,
    cidade: formData.get("cidade") || undefined,
    estado: formData.get("estado") || undefined,
    cep: formData.get("cep") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("cliente_enderecos").insert({
    cliente_id: clienteId,
    ...parsed.data,
  });

  if (error) return { error: "Não foi possível adicionar o endereço." };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true };
}

export async function removeEndereco(enderecoId: string, clienteId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cliente_enderecos")
    .delete()
    .eq("id", enderecoId);

  if (error) return { error: "Não foi possível remover o endereço." };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true };
}

export async function updateCliente(
  clienteId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseClienteForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ ...parsed.data, email: parsed.data.email || null })
    .eq("id", clienteId);

  if (error) return { error: "Não foi possível atualizar o cliente." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function analisarClienteComIA(
  clienteId: string
): Promise<ActionState> {
  await requireUser();
  const result = await generateClienteAnalise(clienteId);
  if (result.error) return { error: result.error };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true };
}
