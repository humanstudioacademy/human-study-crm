"use client";

import { useActionState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analisarClienteComIA } from "@/lib/actions/clientes.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";

export function ClienteInsightSection({
  clienteId,
  insight,
}: {
  clienteId: string;
  insight: Tables<"cliente_insights"> | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, _formData: FormData) =>
      analisarClienteComIA(clienteId),
    undefined
  );

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Análise de IA
        </CardTitle>
        <form action={formAction}>
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {pending
              ? "Analisando..."
              : insight
                ? "Analisar novamente"
                : "Analisar com IA"}
          </Button>
        </form>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {state?.error && <p className="text-destructive">{state.error}</p>}
        {insight ? (
          <>
            <p className="whitespace-pre-wrap">{insight.analise}</p>
            <p className="text-xs text-muted-foreground">
              Gerado{" "}
              {formatDistanceToNow(new Date(insight.gerado_em), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            Nenhuma análise gerada ainda para este cliente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
