"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitFormulario } from "@/lib/actions/formularios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";

type Campo = Tables<"formulario_campos">;

export function FormularioPublico({
  slug,
  campos,
  utms,
}: {
  slug: string;
  campos: Campo[];
  utms: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitFormulario.bind(null, slug),
    undefined
  );

  if (state?.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="font-medium">Recebemos seu contato!</p>
          <p className="text-sm text-muted-foreground">
            Em breve alguém do nosso time vai falar com você.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {Object.entries(utms).map(
            ([key, value]) =>
              value && <input key={key} type="hidden" name={key} value={value} />
          )}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" />
            </div>
          </div>

          {campos.map((campo) => (
            <div key={campo.id} className="space-y-2">
              <Label htmlFor={campo.chave}>{campo.rotulo}</Label>
              {campo.tipo === "textarea" ? (
                <Textarea
                  id={campo.chave}
                  name={campo.chave}
                  required={campo.obrigatorio}
                  rows={3}
                />
              ) : campo.tipo === "select" ? (
                <Select name={campo.chave} required={campo.obrigatorio}>
                  <SelectTrigger id={campo.chave} className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {((campo.opcoes as string[] | null) ?? []).map((opcao) => (
                      <SelectItem key={opcao} value={opcao}>
                        {opcao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={campo.chave}
                  name={campo.chave}
                  type={
                    campo.tipo === "email"
                      ? "email"
                      : campo.tipo === "numero"
                        ? "number"
                        : "text"
                  }
                  required={campo.obrigatorio}
                />
              )}
            </div>
          ))}

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
