"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DealCard } from "./deal-card";
import type { KanbanEtapa, KanbanNegocio } from "./types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function KanbanColumn({
  etapa,
  negocios,
}: {
  etapa: KanbanEtapa;
  negocios: KanbanNegocio[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const total = negocios.reduce((sum, n) => sum + n.valor, 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="space-y-1 border-b p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{etapa.nome}</p>
          <Badge variant="secondary">{negocios.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {currency.format(total)} · {etapa.probabilidade_conversao}%
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto p-2 transition-colors",
          isOver && "bg-muted/60"
        )}
      >
        {negocios.map((negocio) => (
          <DealCard key={negocio.id} negocio={negocio} />
        ))}
      </div>
    </div>
  );
}
