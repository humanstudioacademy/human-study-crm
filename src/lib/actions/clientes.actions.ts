"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
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
