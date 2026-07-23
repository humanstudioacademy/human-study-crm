"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClienteInline } from "@/lib/actions/clientes.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

type CreateClienteState =
  | (ActionState & { clienteId?: string; clienteNome?: string })
  | undefined;

export function QuickCreateCliente({
  onCreated,
}: {
  onCreated: (cliente: { id: string; nome: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    CreateClienteState,
    FormData
  >(createClienteInline, undefined);

  useCloseOnSuccess(state, () => {
    if (state?.clienteId && state.clienteNome) {
      onCreated({ id: state.clienteId, nome: state.clienteNome });
    }
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <UserPlus className="size-4" />
        Novo cliente
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente rápido</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qc-nome">Nome</Label>
            <Input id="qc-nome" name="nome" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qc-email">E-mail</Label>
              <Input id="qc-email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qc-telefone">Telefone</Label>
              <Input id="qc-telefone" name="telefone" />
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando..." : "Criar e usar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
