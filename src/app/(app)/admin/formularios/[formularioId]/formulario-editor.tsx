"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addCampo,
  removeCampo,
  updateFormulario,
} from "@/lib/actions/formularios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

type Pipeline = {
  id: string;
  nome: string;
  etapas: { id: string; nome: string; posicao: number }[];
};

type Formulario = Tables<"formularios">;
type Campo = Tables<"formulario_campos">;
type Submissao = Tables<"formulario_submissoes"> & {
  cliente: { nome: string } | null;
  negocio: { id: string; titulo: string } | null;
};

const tipoLabel: Record<string, string> = {
  texto: "Texto",
  email: "E-mail",
  telefone: "Telefone",
  numero: "Número",
  select: "Seleção",
  textarea: "Texto longo",
};

export function FormularioEditor({
  formulario,
  pipelines,
  usuarios,
  campos,
  submissoes,
}: {
  formulario: Formulario;
  pipelines: Pipeline[];
  usuarios: { id: string; full_name: string }[];
  campos: Campo[];
  submissoes: Submissao[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateFormulario.bind(null, formulario.id),
    undefined
  );
  const [pipelineId, setPipelineId] = useState(formulario.pipeline_id);
  const etapas = pipelines.find((p) => p.id === pipelineId)?.etapas ?? [];
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${formulario.slug}`
      : `/f/${formulario.slug}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{formulario.nome}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{publicUrl}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success("Link copiado.");
            }}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            render={<a href={`/f/${formulario.slug}`} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="size-3.5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={formulario.nome} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                rows={2}
                defaultValue={formulario.descricao ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pipeline_id">Pipeline de destino</Label>
                <Select
                  name="pipeline_id"
                  items={Object.fromEntries(pipelines.map((p) => [p.id, p.nome]))}
                  value={pipelineId}
                  onValueChange={(value) => value && setPipelineId(value)}
                  required
                >
                  <SelectTrigger id="pipeline_id" className="w-full">
                    <SelectValue />
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
                  defaultValue={
                    etapas.some((e) => e.id === formulario.etapa_id)
                      ? formulario.etapa_id
                      : etapas[0]?.id
                  }
                  required
                >
                  <SelectTrigger id="etapa_id" className="w-full">
                    <SelectValue />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_padrao_id">Responsável padrão</Label>
              <Select
                name="owner_padrao_id"
                items={Object.fromEntries(usuarios.map((u) => [u.id, u.full_name]))}
                defaultValue={formulario.owner_padrao_id}
                required
              >
                <SelectTrigger id="owner_padrao_id" className="w-full">
                  <SelectValue />
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
              <input type="checkbox" name="ativo" defaultChecked={formulario.ativo} />
              Formulário ativo
            </label>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Campos personalizados</h2>
          <NovoCampoDialog formularioId={formulario.id} />
        </div>
        <p className="text-sm text-muted-foreground">
          Nome, e-mail e telefone já são coletados por padrão. Adicione campos
          extras aqui (ex: empresa, orçamento, interesse).
        </p>
        <ul className="space-y-2">
          {campos.map((campo) => (
            <li
              key={campo.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
            >
              <div>
                <span className="font-medium">{campo.rotulo}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  ({campo.chave} · {tipoLabel[campo.tipo]}
                  {campo.obrigatorio ? " · obrigatório" : ""})
                </span>
              </div>
              <RemoveCampoButton campoId={campo.id} formularioId={formulario.id} />
            </li>
          ))}
          {campos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum campo personalizado ainda.
            </p>
          )}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Envios recentes ({submissoes.length})</h2>
        <ul className="space-y-2">
          {submissoes.map((s) => (
            <li key={s.id} className="rounded-lg border bg-card p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.cliente?.nome ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(s.created_at), "d 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              {s.negocio && (
                <Badge variant="secondary" className="mt-1">
                  {s.negocio.titulo}
                </Badge>
              )}
            </li>
          ))}
          {submissoes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum envio recebido ainda.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}

function RemoveCampoButton({
  campoId,
  formularioId,
}: {
  campoId: string;
  formularioId: string;
}) {
  async function handleRemove() {
    const result = await removeCampo(campoId, formularioId);
    if (result?.error) toast.error(result.error);
  }
  return (
    <Button variant="ghost" size="icon-sm" onClick={handleRemove}>
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}

function NovoCampoDialog({ formularioId }: { formularioId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addCampo.bind(null, formularioId),
    undefined
  );
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-4" />
        Novo campo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo campo personalizado</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="chave">Chave</Label>
              <Input id="chave" name="chave" placeholder="orcamento" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rotulo">Rótulo</Label>
              <Input id="rotulo" name="rotulo" placeholder="Orçamento" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              name="tipo"
              items={tipoLabel}
              defaultValue="texto"
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tipoLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opcoes">Opções (para o tipo Seleção, separadas por vírgula)</Label>
            <Input id="opcoes" name="opcoes" placeholder="Até 5k, 5k a 20k, Acima de 20k" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="obrigatorio" />
            Campo obrigatório
          </label>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adicionando..." : "Adicionar campo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
