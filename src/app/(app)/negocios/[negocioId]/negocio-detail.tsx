"use client";

import Link from "next/link";
import { useActionState } from "react";
import { differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateNegocio } from "@/lib/actions/negocios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";
import { OfertasSection } from "./ofertas-section";
import { HistoricoSection } from "./historico-section";

type Negocio = Tables<"negocios"> & {
  cliente: { id: string; nome: string; empresa: string | null } | null;
  etapa: { nome: string } | null;
  owner: { full_name: string } | null;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusLabel: Record<string, string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
};

const utmFields: { key: keyof Negocio; label: string }[] = [
  { key: "utm_source", label: "Source" },
  { key: "utm_campaign", label: "Campaign" },
  { key: "utm_medium", label: "Medium" },
  { key: "utm_term", label: "Term" },
  { key: "utm_content", label: "Content" },
];

export function NegocioDetail({
  negocio,
  outrosNegocios,
  historico,
  negocioOfertas,
  ofertasDisponiveis,
}: {
  negocio: Negocio;
  outrosNegocios: Pick<Tables<"negocios">, "id" | "titulo" | "valor" | "status">[];
  historico: (Tables<"negocio_historico"> & {
    autor: { full_name: string } | null;
  })[];
  negocioOfertas: (Tables<"negocio_ofertas"> & {
    oferta: { nome: string; produto: { nome: string } | null } | null;
  })[];
  ofertasDisponiveis: {
    id: string;
    nome: string;
    preco_atual: number;
    produto: { nome: string } | null;
  }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateNegocio.bind(null, negocio.id),
    undefined
  );

  const diasParado = differenceInDays(
    new Date(),
    new Date(negocio.stage_entered_at)
  );
  const hasUtm = utmFields.some((f) => negocio[f.key]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{negocio.titulo}</h1>
            <Badge variant="secondary">{negocio.etapa?.nome}</Badge>
          </div>
          {negocio.cliente && (
            <p className="text-sm text-muted-foreground">
              Cliente:{" "}
              <Link
                href={`/clientes/${negocio.cliente.id}`}
                className="underline"
              >
                {negocio.cliente.nome}
              </Link>
              {negocio.cliente.empresa && ` · ${negocio.cliente.empresa}`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Responsável: {negocio.owner?.full_name}
          </p>
        </div>
        <Badge
          variant={diasParado >= 7 ? "outline" : "secondary"}
          className={diasParado >= 7 ? "text-amber-600" : ""}
        >
          {diasParado <= 0 ? "Movimentado hoje" : `${diasParado}d parado`}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do negócio</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                name="titulo"
                defaultValue={negocio.titulo}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                rows={3}
                defaultValue={negocio.descricao ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={negocio.valor}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  items={{ open: "Em aberto", won: "Ganho", lost: "Perdido" }}
                  defaultValue={negocio.status}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Em aberto</SelectItem>
                    <SelectItem value="won">Ganho</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>

          {hasUtm && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Origem (UTM)</p>
                <div className="flex flex-wrap gap-2">
                  {utmFields.map(
                    (f) =>
                      negocio[f.key] && (
                        <Badge key={f.key} variant="outline">
                          {f.label}: {String(negocio[f.key])}
                        </Badge>
                      )
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OfertasSection
        negocioId={negocio.id}
        negocioOfertas={negocioOfertas}
        ofertasDisponiveis={ofertasDisponiveis}
      />

      {outrosNegocios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">
            Outros negócios de {negocio.cliente?.nome}
          </h2>
          <ul className="space-y-2">
            {outrosNegocios.map((outro) => (
              <li key={outro.id}>
                <Link href={`/negocios/${outro.id}`}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex items-center justify-between py-3">
                      <span className="font-medium">{outro.titulo}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {currency.format(outro.valor)}
                        </span>
                        <Badge variant="secondary">
                          {statusLabel[outro.status]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <HistoricoSection negocioId={negocio.id} historico={historico} />
    </div>
  );
}

