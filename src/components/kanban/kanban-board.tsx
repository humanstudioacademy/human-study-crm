"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { moveNegocioEtapa } from "@/lib/actions/negocios.actions";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import { NewNegocioDialog } from "./new-negocio-dialog";
import type { KanbanEtapa, KanbanNegocio } from "./types";

export function KanbanBoard({
  pipelineId,
  etapas,
  negocios,
  clientes,
  transicoes,
  isAdmin,
}: {
  pipelineId: string;
  etapas: KanbanEtapa[];
  negocios: KanbanNegocio[];
  clientes: { id: string; nome: string }[];
  transicoes: Record<string, string[]>;
  isAdmin: boolean;
}) {
  const [items, setItems] = useState(negocios);
  const [prevNegocios, setPrevNegocios] = useState(negocios);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Resincroniza com os dados do servidor (ex: após revalidatePath de uma
  // criação/edição de negócio) — o estado local só existe para o drag otimista.
  // Ajuste durante o render (não em efeito) conforme o padrão recomendado pelo
  // React para "adjusting state when a prop changes".
  if (negocios !== prevNegocios) {
    setPrevNegocios(negocios);
    setItems(negocios);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const activeNegocio = items.find((n) => n.id === activeId) ?? null;
  const allowedDestinos = activeNegocio
    ? transicoes[activeNegocio.etapa_id]
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const negocioId = String(active.id);
    const novaEtapaId = String(over.id);
    const negocio = items.find((n) => n.id === negocioId);
    if (!negocio || negocio.etapa_id === novaEtapaId) return;

    const permitido = transicoes[negocio.etapa_id];
    if (permitido && !permitido.includes(novaEtapaId)) {
      toast.error("Essa etapa não permite mover o negócio para o destino escolhido.");
      return;
    }

    const anterior = negocio.etapa_id;
    setItems((prev) =>
      prev.map((n) =>
        n.id === negocioId ? { ...n, etapa_id: novaEtapaId } : n
      )
    );

    startTransition(async () => {
      const result = await moveNegocioEtapa(negocioId, novaEtapaId, pipelineId);
      if (result?.error) {
        toast.error(result.error);
        setItems((prev) =>
          prev.map((n) =>
            n.id === negocioId ? { ...n, etapa_id: anterior } : n
          )
        );
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex shrink-0 justify-end">
        <NewNegocioDialog
          pipelineId={pipelineId}
          etapas={etapas}
          clientes={clientes}
        />
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex min-h-0 flex-1 items-stretch gap-3 overflow-x-auto pb-2">
          {etapas.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              pipelineId={pipelineId}
              isAdmin={isAdmin}
              negocios={items.filter((n) => n.etapa_id === etapa.id)}
              disabled={
                !!activeNegocio &&
                etapa.id !== activeNegocio.etapa_id &&
                !!allowedDestinos &&
                !allowedDestinos.includes(etapa.id)
              }
            />
          ))}
        </div>
        <DragOverlay>
          {activeNegocio && (
            <div className="w-72 rotate-1 opacity-95">
              <DealCard
                negocio={activeNegocio}
                pipelineId={pipelineId}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
