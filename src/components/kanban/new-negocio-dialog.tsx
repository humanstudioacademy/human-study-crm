"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuickCreateCliente } from "@/components/clientes/quick-create-cliente";
import { createNegocio } from "@/lib/actions/negocios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import type { KanbanEtapa } from "./types";

export function NewNegocioDialog({
  pipelineId,
  etapas,
  clientes,
}: {
  pipelineId: string;
  etapas: KanbanEtapa[];
  clientes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [clientesList, setClientesList] = useState(clientes);
  const [selectedCliente, setSelectedCliente] = useState<string | undefined>();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createNegocio.bind(null, pipelineId),
    undefined
  );

  useCloseOnSuccess(state, () => {
    setOpen(false);
    setShowUtm(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShowUtm(false);
      }}
    >
      <DialogTrigger render={<Button />}>Novo negócio</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo negócio</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cliente_id">Cliente</Label>
              <QuickCreateCliente
                onCreated={(cliente) => {
                  setClientesList((prev) => [cliente, ...prev]);
                  setSelectedCliente(cliente.id);
                }}
              />
            </div>
            <Select
              name="cliente_id"
              items={Object.fromEntries(clientesList.map((c) => [c.id, c.nome]))}
              value={selectedCliente}
              onValueChange={(value) => setSelectedCliente(value ?? undefined)}
              required
            >
              <SelectTrigger id="cliente_id" className="w-full">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientesList.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etapa_id">Etapa</Label>
              <Select
                name="etapa_id"
                items={Object.fromEntries(etapas.map((e) => [e.id, e.nome]))}
                defaultValue={etapas[0]?.id}
                required
              >
                <SelectTrigger id="etapa_id" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min={0}
                defaultValue={0}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowUtm((v) => !v)}
            className="text-sm text-muted-foreground underline"
          >
            {showUtm ? "Ocultar UTM" : "Adicionar origem (UTM)"}
          </button>

          {showUtm && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="utm_source" className="text-xs">
                  utm_source
                </Label>
                <Input id="utm_source" name="utm_source" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="utm_campaign" className="text-xs">
                  utm_campaign
                </Label>
                <Input id="utm_campaign" name="utm_campaign" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="utm_medium" className="text-xs">
                  utm_medium
                </Label>
                <Input id="utm_medium" name="utm_medium" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="utm_term" className="text-xs">
                  utm_term
                </Label>
                <Input id="utm_term" name="utm_term" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="utm_content" className="text-xs">
                  utm_content
                </Label>
                <Input id="utm_content" name="utm_content" />
              </div>
            </div>
          )}

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando..." : "Criar negócio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
