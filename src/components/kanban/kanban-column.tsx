"use client";

import { useDroppable } from "@dnd-kit/core";
import { CheckCircle2, XCircle, Circle } from "lucide-react";
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
  pipelineId,
  isAdmin,
  disabled = false,
}: {
  etapa: KanbanEtapa;
  negocios: KanbanNegocio[];
  pipelineId: string;
  isAdmin: boolean;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
    disabled,
  });
  const total = negocios.reduce((sum, n) => sum + n.valor, 0);

  const StageIcon = etapa.is_won_stage
    ? CheckCircle2
    : etapa.is_lost_stage
      ? XCircle
      : Circle;

  return (
    <div
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-xl border transition-opacity",
        etapa.is_won_stage && "border-success/30 bg-success/5",
        etapa.is_lost_stage && "border-destructive/30 bg-destructive/5",
        !etapa.is_won_stage && !etapa.is_lost_stage && "border-border/60 bg-muted/20",
        disabled && "opacity-40"
      )}
    >
      <div className="shrink-0 space-y-1 border-b border-inherit p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StageIcon
              className={cn(
                "size-3.5",
                etapa.is_won_stage && "text-success",
                etapa.is_lost_stage && "text-destructive",
                !etapa.is_won_stage && !etapa.is_lost_stage && "text-muted-foreground"
              )}
            />
            <p className="text-sm font-semibold">{etapa.nome}</p>
          </div>
          <Badge variant="secondary">{negocios.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {currency.format(total)} · {etapa.probabilidade_conversao}%
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-24 flex-1 space-y-2 overflow-y-auto p-2 transition-colors",
          isOver && !disabled && "bg-primary/5"
        )}
      >
        {negocios.map((negocio) => (
          <DealCard
            key={negocio.id}
            negocio={negocio}
            pipelineId={pipelineId}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}
