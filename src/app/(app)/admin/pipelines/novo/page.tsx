"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPipeline, type ActionState } from "@/lib/actions/pipelines.actions";

export default function NovaPipelinePage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPipeline,
    undefined
  );

  return (
    <div className="mx-auto max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Nova pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Depois de criar, você adiciona as etapas.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required placeholder="Ex: Vendas" />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar pipeline"}
        </Button>
      </form>
    </div>
  );
}
