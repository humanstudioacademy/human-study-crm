"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
import { generateNegocioInsight } from "@/lib/ai/insights";
import type { ActionState } from "@/lib/actions/pipelines.actions";

const eventoSchema = z.object({
  tipo: z.enum(["reuniao", "ligacao", "email", "visita", "outro"]),
  titulo: z.string().trim().min(1, "Informe um título."),
  descricao: z.string().trim().optional(),
  inicio: z.string().min(1, "Informe a data/hora de início."),
  fim: z.string().optional(),
});

function toIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createEvento(
  negocioId: string | null,
  revalidateHref: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = eventoSchema.safeParse({
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    inicio: formData.get("inicio"),
    fim: formData.get("fim") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const inicioIso = toIso(parsed.data.inicio);
  if (!inicioIso) return { error: "Data/hora de início inválida." };
  const fimIso = parsed.data.fim ? toIso(parsed.data.fim) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("eventos").insert({
    negocio_id: negocioId,
    owner_id: user.id,
    tipo: parsed.data.tipo,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    inicio: inicioIso,
    fim: fimIso,
  });

  if (error) return { error: "Não foi possível agendar." };

  revalidatePath(revalidateHref);
  revalidatePath("/agenda");
  if (negocioId) after(() => generateNegocioInsight(negocioId));
  return { success: true };
}

export async function toggleEventoConcluido(
  eventoId: string,
  concluido: boolean,
  revalidateHref: string
) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("eventos")
    .update({ concluido })
    .eq("id", eventoId);

  if (error) return { error: "Não foi possível atualizar o evento." };

  revalidatePath(revalidateHref);
  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteEvento(eventoId: string, revalidateHref: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").delete().eq("id", eventoId);

  if (error) return { error: "Não foi possível excluir o evento." };

  revalidatePath(revalidateHref);
  revalidatePath("/agenda");
  return { success: true };
}
