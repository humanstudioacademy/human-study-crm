"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addOfertaToNegocio,
  removeOfertaFromNegocio,
} from "@/lib/actions/negocios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type NegocioOferta = Tables<"negocio_ofertas"> & {
  oferta: { nome: string; produto: { nome: string } | null } | null;
};

export function OfertasSection({
  negocioId,
  negocioOfertas,
  ofertasDisponiveis,
}: {
  negocioId: string;
  negocioOfertas: NegocioOferta[];
  ofertasDisponiveis: {
    id: string;
    nome: string;
    preco_atual: number;
    produto: { nome: string } | null;
  }[];
}) {
  const total = negocioOfertas.reduce(
    (sum, item) => sum + item.quantidade * item.preco_unitario_snapshot,
    0
  );

  async function handleRemove(negocioOfertaId: string) {
    const result = await removeOfertaFromNegocio(negocioOfertaId, negocioId);
    if (result?.error) toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Ofertas associadas</CardTitle>
        <AddOfertaDialog negocioId={negocioId} ofertas={ofertasDisponiveis} />
      </CardHeader>
      <CardContent className="space-y-2">
        {negocioOfertas.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="text-sm font-medium">{item.oferta?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {item.oferta?.produto?.nome} · {item.quantidade}x{" "}
                {currency.format(item.preco_unitario_snapshot)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(item.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
        {negocioOfertas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma oferta associada ainda.
          </p>
        )}
        {negocioOfertas.length > 0 && (
          <p className="pt-2 text-sm font-medium">
            Total das ofertas: {currency.format(total)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AddOfertaDialog({
  negocioId,
  ofertas,
}: {
  negocioId: string;
  ofertas: {
    id: string;
    nome: string;
    preco_atual: number;
    produto: { nome: string } | null;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addOfertaToNegocio.bind(null, negocioId),
    undefined
  );

  useCloseOnSuccess(state, () => setOpen(false));

  if (ofertas.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Adicionar oferta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar oferta</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oferta_id">Oferta</Label>
            <Select
              name="oferta_id"
              items={Object.fromEntries(
                ofertas.map((o) => [
                  o.id,
                  `${o.produto?.nome} — ${o.nome} (${currency.format(o.preco_atual)})`,
                ])
              )}
              required
            >
              <SelectTrigger id="oferta_id" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ofertas.map((oferta) => (
                  <SelectItem key={oferta.id} value={oferta.id}>
                    {oferta.produto?.nome} — {oferta.nome} (
                    {currency.format(oferta.preco_atual)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              name="quantidade"
              type="number"
              min={1}
              defaultValue={1}
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
