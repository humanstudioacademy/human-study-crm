import type { Tables } from "@/lib/types/database.types";

export type KanbanNegocio = Pick<
  Tables<"negocios">,
  "id" | "titulo" | "valor" | "status" | "etapa_id" | "stage_entered_at" | "utm_source"
> & {
  cliente: { nome: string } | null;
  owner: { full_name: string } | null;
};

export type KanbanEtapa = Tables<"etapas">;
