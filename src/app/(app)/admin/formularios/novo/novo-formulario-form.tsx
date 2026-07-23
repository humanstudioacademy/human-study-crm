"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFormulario } from "@/lib/actions/formularios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";

type Pipeline = {
  id: string;
  nome: string;
  etapas: { id: string; nome: string; posicao: number }[];
};

export function NovoFormularioForm({
  pipelines,
  usuarios,
}: {
  pipelines: Pipeline[];
  usuarios: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createFormulario,
    undefined
  );
  const [pipelineId, setPipelineId] = useState<string | undefined>(
    pipelines[0]?.id
  );
  const [ownerId, setOwnerId] = useState<string | undefined>(usuarios[0]?.id);
  const etapas = pipelines.find((p) => p.id === pipelineId)?.etapas ?? [];

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" required placeholder="Ex: Fale conosco" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pipeline_id">Pipeline de destino</Label>
        <Select
          name="pipeline_id"
          items={Object.fromEntries(pipelines.map((p) => [p.id, p.nome]))}
          value={pipelineId}
          onValueChange={(value) => setPipelineId(value ?? undefined)}
          required
        >
          <SelectTrigger id="pipeline_id" className="w-full">
            <SelectValue placeholder="Selecione a pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="etapa_id">Etapa de entrada</Label>
        <Select
          name="etapa_id"
          items={Object.fromEntries(etapas.map((e) => [e.id, e.nome]))}
          key={pipelineId}
          defaultValue={etapas[0]?.id}
          required
        >
          <SelectTrigger id="etapa_id" className="w-full">
            <SelectValue placeholder="Selecione a etapa" />
          </SelectTrigger>
          <SelectContent>
            {etapas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner_padrao_id">Responsável padrão</Label>
        <Select
          name="owner_padrao_id"
          items={Object.fromEntries(usuarios.map((u) => [u.id, u.full_name]))}
          value={ownerId}
          onValueChange={(value) => setOwnerId(value ?? undefined)}
          required
        >
          <SelectTrigger id="owner_padrao_id" className="w-full">
            <SelectValue placeholder="Quem recebe os leads deste formulário" />
          </SelectTrigger>
          <SelectContent>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ativo" defaultChecked />
        Formulário ativo
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar formulário"}
      </Button>
    </form>
  );
}
