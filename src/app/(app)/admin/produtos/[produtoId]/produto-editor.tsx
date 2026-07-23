"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  changeOfertaPreco,
  createOferta,
  updateOfertaInfo,
  updateProduto,
} from "@/lib/actions/produtos.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import type { Tables } from "@/lib/types/database.types";

type Produto = Tables<"produtos">;
type Oferta = Tables<"ofertas">;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ProdutoEditor({
  produto,
  ofertas,
}: {
  produto: Produto;
  ofertas: Oferta[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProduto.bind(null, produto.id),
    undefined
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{produto.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Edite os dados do produto e gerencie as ofertas.
        </p>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" defaultValue={produto.nome} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            name="descricao"
            rows={3}
            defaultValue={produto.descricao ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={produto.is_active}
          />
          Produto ativo
        </label>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar produto"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Ofertas</h2>
          <NovaOfertaDialog produtoId={produto.id} />
        </div>

        <ul className="space-y-2">
          {ofertas.map((oferta) => (
            <li
              key={oferta.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex-1">
                <p className="font-medium">{oferta.nome}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currency.format(oferta.preco_atual)}</span>
                  {!oferta.is_active && (
                    <Badge variant="outline">Inativa</Badge>
                  )}
                </div>
              </div>
              <EditarOfertaDialog produtoId={produto.id} oferta={oferta} />
              <PrecoDialog produtoId={produto.id} oferta={oferta} />
            </li>
          ))}
        </ul>
        {ofertas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma oferta cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}

function NovaOfertaDialog({ produtoId }: { produtoId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createOferta.bind(null, produtoId),
    undefined
  );

  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Nova oferta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova oferta</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oferta-nome">Nome</Label>
            <Input id="oferta-nome" name="nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preco_atual">Preço (R$)</Label>
            <Input
              id="preco_atual"
              name="preco_atual"
              type="number"
              step="0.01"
              min={0}
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando..." : "Criar oferta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarOfertaDialog({
  produtoId,
  oferta,
}: {
  produtoId: string;
  oferta: Oferta;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateOfertaInfo.bind(null, oferta.id, produtoId),
    undefined
  );

  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Editar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar oferta</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input
              id="edit-nome"
              name="nome"
              defaultValue={oferta.nome}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={oferta.is_active}
            />
            Oferta ativa
          </label>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PrecoDialog({
  produtoId,
  oferta,
}: {
  produtoId: string;
  oferta: Oferta;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changeOfertaPreco.bind(null, oferta.id, produtoId),
    undefined
  );

  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" size="sm" />}>
        Alterar preço
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar preço — {oferta.nome}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Preço atual: {currency.format(oferta.preco_atual)}. Negócios já
            fechados mantêm o preço vigente na época — só as novas
            associações usam o novo valor.
          </p>
          <div className="space-y-2">
            <Label htmlFor="novo_preco">Novo preço (R$)</Label>
            <Input
              id="novo_preco"
              name="novo_preco"
              type="number"
              step="0.01"
              min={0}
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Confirmar novo preço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
