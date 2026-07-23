"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduto } from "@/lib/actions/produtos.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";

export default function NovoProdutoPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createProduto,
    undefined
  );

  return (
    <div className="mx-auto max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Novo produto</h1>
        <p className="text-sm text-muted-foreground">
          Depois de criar, você adiciona as ofertas com preço.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" name="descricao" rows={3} />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar produto"}
        </Button>
      </form>
    </div>
  );
}
