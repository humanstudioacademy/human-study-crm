"use client";

import { useActionState, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createEtapa,
  deleteEtapa,
  renamePipeline,
  reorderEtapas,
  updateEtapa,
  updateEtapaTransicoes,
  type ActionState,
} from "@/lib/actions/pipelines.actions";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import type { Tables } from "@/lib/types/database.types";

type Pipeline = Tables<"pipelines">;
type Etapa = Tables<"etapas">;

export function PipelineEditor({
  pipeline,
  etapas,
  transicoes,
}: {
  pipeline: Pipeline;
  etapas: Etapa[];
  transicoes: Record<string, string[]>;
}) {
  const [renameState, renameAction, renamePending] = useActionState<
    ActionState,
    FormData
  >(renamePipeline.bind(null, pipeline.id), undefined);

  const [items, setItems] = useState(etapas);
  const [prevEtapas, setPrevEtapas] = useState(etapas);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor));

  // Resincroniza com os dados do servidor após criar/editar/excluir uma etapa
  // (revalidatePath) — o estado local existe só para o drag otimista.
  if (etapas !== prevEtapas) {
    setPrevEtapas(etapas);
    setItems(etapas);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((e) => e.id === active.id);
    const newIndex = items.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    startTransition(async () => {
      const result = await reorderEtapas(
        pipeline.id,
        reordered.map((e) => e.id)
      );
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{pipeline.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Renomeie a pipeline e gerencie as etapas do fluxo.
        </p>
      </div>

      <form
        action={renameAction}
        className="flex items-end gap-2 rounded-lg border p-4"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="nome">Nome da pipeline</Label>
          <Input id="nome" name="nome" defaultValue={pipeline.nome} required />
        </div>
        <Button type="submit" disabled={renamePending}>
          Salvar
        </Button>
        {renameState?.error && (
          <p className="text-sm text-destructive">{renameState.error}</p>
        )}
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Etapas</h2>
          <EtapaFormDialog pipelineId={pipeline.id} allEtapas={items} />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {items.map((etapa) => (
                <EtapaRow
                  key={etapa.id}
                  etapa={etapa}
                  pipelineId={pipeline.id}
                  allEtapas={items}
                  transicoesPermitidas={transicoes[etapa.id] ?? []}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa ainda. Adicione a primeira acima.
          </p>
        )}
      </div>
    </div>
  );
}

function EtapaRow({
  etapa,
  pipelineId,
  allEtapas,
  transicoesPermitidas,
}: {
  etapa: Etapa;
  pipelineId: string;
  allEtapas: Etapa[];
  transicoesPermitidas: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleDelete() {
    const result = await deleteEtapa(etapa.id, pipelineId);
    if (result?.error) toast.error(result.error);
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{etapa.nome}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{etapa.probabilidade_conversao}% de conversão</span>
          {etapa.is_won_stage && <Badge variant="secondary">Ganho</Badge>}
          {etapa.is_lost_stage && <Badge variant="secondary">Perdido</Badge>}
          {transicoesPermitidas.length > 0 && (
            <Badge variant="outline">
              Só vai para {transicoesPermitidas.length} etapa(s)
            </Badge>
          )}
        </div>
      </div>
      <EtapaFormDialog
        pipelineId={pipelineId}
        etapa={etapa}
        allEtapas={allEtapas}
        transicoesPermitidas={transicoesPermitidas}
      />
      <Button variant="ghost" size="icon" onClick={handleDelete}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </li>
  );
}

function EtapaFormDialog({
  pipelineId,
  etapa,
  allEtapas = [],
  transicoesPermitidas = [],
}: {
  pipelineId: string;
  etapa?: Etapa;
  allEtapas?: Etapa[];
  transicoesPermitidas?: string[];
}) {
  const [open, setOpen] = useState(false);
  const action = etapa
    ? updateEtapa.bind(null, etapa.id, pipelineId)
    : createEtapa.bind(null, pipelineId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined
  );

  const [transicoesState, transicoesAction, transicoesPending] = useActionState<
    ActionState,
    FormData
  >(
    etapa
      ? updateEtapaTransicoes.bind(null, etapa.id, pipelineId)
      : async (_state: ActionState, _formData: FormData) => undefined,
    undefined
  );

  useCloseOnSuccess(state, () => setOpen(false));

  const outrasEtapas = allEtapas.filter((e) => e.id !== etapa?.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      {etapa ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          Adicionar etapa
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{etapa ? "Editar etapa" : "Nova etapa"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="etapa-nome">Nome</Label>
            <Input
              id="etapa-nome"
              name="nome"
              required
              defaultValue={etapa?.nome}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="probabilidade">Probabilidade de conversão (%)</Label>
            <Input
              id="probabilidade"
              name="probabilidade_conversao"
              type="number"
              min={0}
              max={100}
              required
              defaultValue={etapa?.probabilidade_conversao ?? 0}
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_won_stage"
                defaultChecked={etapa?.is_won_stage}
              />
              Etapa de ganho
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_lost_stage"
                defaultChecked={etapa?.is_lost_stage}
              />
              Etapa de perda
            </label>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>

        {etapa && outrasEtapas.length > 0 && (
          <>
            <Separator />
            <form action={transicoesAction} className="space-y-3">
              <div>
                <Label>Para quais etapas esta pode ir?</Label>
                <p className="text-xs text-muted-foreground">
                  Deixe tudo desmarcado para permitir ir para qualquer etapa.
                </p>
              </div>
              <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto">
                {outrasEtapas.map((e) => (
                  <label
                    key={e.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="destino"
                      value={e.id}
                      defaultChecked={transicoesPermitidas.includes(e.id)}
                    />
                    {e.nome}
                  </label>
                ))}
              </div>
              {transicoesState?.error && (
                <p className="text-sm text-destructive">
                  {transicoesState.error}
                </p>
              )}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={transicoesPending}
              >
                {transicoesPending ? "Salvando..." : "Salvar transições"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
