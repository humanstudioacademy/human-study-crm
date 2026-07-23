"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Database } from "@/lib/types/database.types";

type CampoTipo = Database["public"]["Enums"]["campo_tipo"];

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const formularioSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do formulário."),
  descricao: z.string().trim().optional(),
  pipeline_id: z.string().uuid("Selecione uma pipeline."),
  etapa_id: z.string().uuid("Selecione uma etapa."),
  owner_padrao_id: z.string().uuid("Selecione um responsável padrão."),
  ativo: z.coerce.boolean().optional().default(true),
});

export async function createFormulario(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = formularioSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    pipeline_id: formData.get("pipeline_id"),
    etapa_id: formData.get("etapa_id"),
    owner_padrao_id: formData.get("owner_padrao_id"),
    ativo: formData.get("ativo") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.nome) || "formulario";
  let slug = baseSlug;
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data: existing } = await supabase
      .from("formularios")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${attempt + 2}`;
  }

  const { data, error } = await supabase
    .from("formularios")
    .insert({ ...parsed.data, slug, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar o formulário." };

  revalidatePath("/admin/formularios");
  redirect(`/admin/formularios/${data.id}`);
}

export async function updateFormulario(
  formularioId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = formularioSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    pipeline_id: formData.get("pipeline_id"),
    etapa_id: formData.get("etapa_id"),
    owner_padrao_id: formData.get("owner_padrao_id"),
    ativo: formData.get("ativo") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("formularios")
    .update(parsed.data)
    .eq("id", formularioId);

  if (error) return { error: "Não foi possível atualizar o formulário." };

  revalidatePath("/admin/formularios");
  revalidatePath(`/admin/formularios/${formularioId}`);
  return { success: true };
}

export async function deleteFormulario(formularioId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("formularios")
    .delete()
    .eq("id", formularioId);

  if (error) return { error: "Não foi possível excluir o formulário." };

  revalidatePath("/admin/formularios");
  redirect("/admin/formularios");
}

const campoSchema = z.object({
  chave: z
    .string()
    .trim()
    .min(1, "Informe a chave do campo.")
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e _."),
  rotulo: z.string().trim().min(1, "Informe o rótulo do campo."),
  tipo: z.enum(["texto", "email", "telefone", "numero", "select", "textarea"]),
  obrigatorio: z.coerce.boolean().optional().default(false),
  opcoes: z.string().trim().optional(),
  mapeia_para: z.string().trim().optional(),
});

export async function addCampo(
  formularioId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = campoSchema.safeParse({
    chave: formData.get("chave"),
    rotulo: formData.get("rotulo"),
    tipo: formData.get("tipo"),
    obrigatorio: formData.get("obrigatorio") === "on",
    opcoes: formData.get("opcoes") || undefined,
    mapeia_para: formData.get("mapeia_para") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("formulario_campos")
    .select("posicao")
    .eq("formulario_id", formularioId)
    .order("posicao", { ascending: false })
    .limit(1);
  const nextPosicao = (existing?.[0]?.posicao ?? -1) + 1;

  const opcoesList = parsed.data.opcoes
    ? parsed.data.opcoes
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : null;

  const { error } = await supabase.from("formulario_campos").insert({
    formulario_id: formularioId,
    chave: parsed.data.chave,
    rotulo: parsed.data.rotulo,
    tipo: parsed.data.tipo as CampoTipo,
    obrigatorio: parsed.data.obrigatorio,
    opcoes: opcoesList,
    mapeia_para: parsed.data.mapeia_para || null,
    posicao: nextPosicao,
  });

  if (error) {
    return {
      error: "Não foi possível adicionar o campo (talvez a chave já exista).",
    };
  }

  revalidatePath(`/admin/formularios/${formularioId}`);
  return { success: true };
}

export async function removeCampo(campoId: string, formularioId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("formulario_campos")
    .delete()
    .eq("id", campoId);

  if (error) return { error: "Não foi possível remover o campo." };

  revalidatePath(`/admin/formularios/${formularioId}`);
  return { success: true };
}

const submissaoSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().trim().optional(),
});

export async function submitFormulario(
  slug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = createAdminClient();

  const { data: formulario } = await admin
    .from("formularios")
    .select("*, campos:formulario_campos(*)")
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (!formulario) return { error: "Formulário não encontrado ou inativo." };

  const parsedBase = submissaoSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email") || "",
    telefone: formData.get("telefone") || undefined,
  });
  if (!parsedBase.success) {
    return { error: parsedBase.error.issues[0]?.message };
  }

  const dados: Record<string, string> = {
    nome: parsedBase.data.nome,
    email: parsedBase.data.email || "",
    telefone: parsedBase.data.telefone || "",
  };
  for (const campo of formulario.campos ?? []) {
    if (["nome", "email", "telefone"].includes(campo.chave)) continue;
    const valor = formData.get(campo.chave);
    if (campo.obrigatorio && !valor) {
      return { error: `Preencha o campo "${campo.rotulo}".` };
    }
    if (valor) dados[campo.chave] = String(valor);
  }

  const email = parsedBase.data.email || null;
  const telefone = parsedBase.data.telefone || null;

  let clienteId: string | null = null;

  if (email) {
    const { data: byEmail } = await admin
      .from("clientes")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    clienteId = byEmail?.id ?? null;
  }

  if (!clienteId && telefone) {
    const { data: byTelefone } = await admin
      .from("clientes")
      .select("id")
      .eq("telefone", telefone)
      .maybeSingle();
    clienteId = byTelefone?.id ?? null;

    if (!clienteId) {
      const { data: byTelefoneExtra } = await admin
        .from("cliente_telefones")
        .select("cliente_id")
        .eq("numero", telefone)
        .maybeSingle();
      clienteId = byTelefoneExtra?.cliente_id ?? null;
    }
  }

  if (!clienteId) {
    const { data: novoCliente, error: clienteError } = await admin
      .from("clientes")
      .insert({
        nome: parsedBase.data.nome,
        email,
        telefone,
        created_by: formulario.owner_padrao_id,
      })
      .select("id")
      .single();

    if (clienteError || !novoCliente) {
      return { error: "Não foi possível registrar seu cadastro." };
    }
    clienteId = novoCliente.id;
  }

  const utmFields = {
    utm_source: (formData.get("utm_source") as string) || null,
    utm_campaign: (formData.get("utm_campaign") as string) || null,
    utm_medium: (formData.get("utm_medium") as string) || null,
    utm_term: (formData.get("utm_term") as string) || null,
    utm_content: (formData.get("utm_content") as string) || null,
  };

  const { data: negocio, error: negocioError } = await admin
    .from("negocios")
    .insert({
      titulo: `${formulario.nome} — ${parsedBase.data.nome}`,
      cliente_id: clienteId,
      pipeline_id: formulario.pipeline_id,
      etapa_id: formulario.etapa_id,
      owner_id: formulario.owner_padrao_id,
      created_by: formulario.owner_padrao_id,
      valor: 0,
      ...utmFields,
    })
    .select("id")
    .single();

  if (negocioError || !negocio) {
    return { error: "Não foi possível registrar sua solicitação." };
  }

  await admin.from("formulario_submissoes").insert({
    formulario_id: formulario.id,
    cliente_id: clienteId,
    negocio_id: negocio.id,
    dados,
    ...utmFields,
  });

  return { success: true };
}
