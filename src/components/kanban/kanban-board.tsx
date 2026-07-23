"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { moveNegocioEtapa } from "@/lib/actions/negocios.actions";
import { KanbanColumn } from "./kanban-column";
import { NewNegocioDialog } from "./new-negocio-dialog";
import type { KanbanEtapa, KanbanNegocio } from "./types";

export function KanbanBoard({
  pipelineId,
  etapas,
  negocios,
  clientes,
}: {
  pipelineId: string;
  etapas: KanbanEtapa[];
  negocios: KanbanNegocio[];
  clientes: { id: string; nome: string }[];
}) {
  const [items, setItems] = useState(negocios);
  const [prevNegocios, setPrevNegocios] = useState(negocios);
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const negocioId = String(active.id);
    const novaEtapaId = String(over.id);
    const negocio = items.find((n) => n.id === negocioId);
    if (!negocio || negocio.etapa_id === novaEtapaId) return;

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
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex justify-end">
        <NewNegocioDialog
          pipelineId={pipelineId}
          etapas={etapas}
          clientes={clientes}
        />
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
          {etapas.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              negocios={items.filter((n) => n.etapa_id === etapa.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
