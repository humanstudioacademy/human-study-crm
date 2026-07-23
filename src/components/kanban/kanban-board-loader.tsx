"use client";

import dynamic from "next/dynamic";
import type { KanbanEtapa, KanbanNegocio } from "./types";

// @dnd-kit gera ids internos (aria-describedby) que não ficam estáveis entre a
// renderização no servidor e a hidratação no cliente em dev — carregamos o
// board só no cliente para evitar o hydration mismatch.
const KanbanBoard = dynamic(
  () => import("./kanban-board").then((mod) => mod.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
    ),
  }
);

export function KanbanBoardLoader(props: {
  pipelineId: string;
  etapas: KanbanEtapa[];
  negocios: KanbanNegocio[];
  clientes: { id: string; nome: string }[];
}) {
  return <KanbanBoard {...props} />;
}
