"use client";

import { useActionState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addNota } from "@/lib/actions/negocios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";

type HistoricoItem = Tables<"negocio_historico"> & {
  autor: { full_name: string } | null;
};

const tipoLabel: Record<string, string> = {
  criado: "Criado",
  etapa_alterada: "Etapa",
  status_alterado: "Status",
  nota: "Nota",
  campo_alterado: "Edição",
  oferta_adicionada: "Oferta",
  oferta_removida: "Oferta",
};

function formatDate(date: string) {
  return format(new Date(date), "d 'de' MMM 'às' HH:mm", { locale: ptBR });
}

export function HistoricoSection({
  negocioId,
  historico,
  onNotaAdded,
}: {
  negocioId: string;
  historico: HistoricoItem[];
  onNotaAdded?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addNota.bind(null, negocioId),
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onNotaAdded?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onNotaAdded é recriado a cada render; reagimos só a `state`
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico da negociação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={formAction} className="space-y-2">
          <Textarea
            name="texto"
            rows={2}
            placeholder="Adicionar uma nota sobre este negócio..."
            required
          />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar nota"}
          </Button>
        </form>

        <ul className="space-y-3 border-t pt-4">
          {historico.map((item) => (
            <li key={item.id} className="text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {tipoLabel[item.tipo] ?? item.tipo}
                </span>
                <span>·</span>
                <span>{formatDate(item.created_at)}</span>
                {item.autor?.full_name && (
                  <>
                    <span>·</span>
                    <span>{item.autor.full_name}</span>
                  </>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap">{item.descricao}</p>
            </li>
          ))}
          {historico.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado ainda.
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
