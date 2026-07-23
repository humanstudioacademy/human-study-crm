"use client";

import { useActionState, useState } from "react";
import { MessageCircle, Plus, Trash2, MapPin } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addEndereco,
  addTelefone,
  removeEndereco,
  removeTelefone,
} from "@/lib/actions/clientes.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { whatsappLink } from "@/lib/utils/contact-links";

type Telefone = Tables<"cliente_telefones">;
type Endereco = Tables<"cliente_enderecos">;

const TIPO_LABEL: Record<string, string> = {
  celular: "Celular",
  fixo: "Fixo",
  whatsapp: "WhatsApp",
};

export function TelefonesSection({
  clienteId,
  telefones,
}: {
  clienteId: string;
  telefones: Telefone[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Telefones adicionais</h3>
        <AddTelefoneDialog clienteId={clienteId} />
      </div>
      <ul className="space-y-1.5">
        {telefones.map((tel) => (
          <li
            key={tel.id}
            className="flex items-center justify-between rounded-md border p-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span>{tel.numero}</span>
              <span className="text-xs text-muted-foreground">
                {TIPO_LABEL[tel.tipo] ?? tel.tipo}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                render={
                  <a
                    href={whatsappLink(tel.numero)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <MessageCircle className="size-4 text-success" />
              </Button>
              <RemoveTelefoneButton telefoneId={tel.id} clienteId={clienteId} />
            </div>
          </li>
        ))}
        {telefones.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum telefone adicional.
          </p>
        )}
      </ul>
    </div>
  );
}

function RemoveTelefoneButton({
  telefoneId,
  clienteId,
}: {
  telefoneId: string;
  clienteId: string;
}) {
  async function handleRemove() {
    const result = await removeTelefone(telefoneId, clienteId);
    if (result?.error) toast.error(result.error);
  }
  return (
    <Button variant="ghost" size="icon-sm" onClick={handleRemove}>
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}

function AddTelefoneDialog({ clienteId }: { clienteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addTelefone.bind(null, clienteId),
    undefined
  );
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Plus className="size-4" />
        Adicionar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo telefone</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" required placeholder="(11) 91234-5678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              name="tipo"
              items={{ celular: "Celular", fixo: "Fixo", whatsapp: "WhatsApp" }}
              defaultValue="celular"
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celular">Celular</SelectItem>
                <SelectItem value="fixo">Fixo</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EnderecosSection({
  clienteId,
  enderecos,
}: {
  clienteId: string;
  enderecos: Endereco[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Endereços</h3>
        <AddEnderecoDialog clienteId={clienteId} />
      </div>
      <ul className="space-y-1.5">
        {enderecos.map((end) => (
          <li
            key={end.id}
            className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm"
          >
            <div className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                {end.label && (
                  <p className="text-xs font-medium text-muted-foreground">
                    {end.label}
                  </p>
                )}
                <p>
                  {[end.logradouro, end.numero].filter(Boolean).join(", ")}
                  {end.complemento ? ` — ${end.complemento}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[end.bairro, end.cidade, end.estado, end.cep]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <RemoveEnderecoButton enderecoId={end.id} clienteId={clienteId} />
          </li>
        ))}
        {enderecos.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum endereço cadastrado.
          </p>
        )}
      </ul>
    </div>
  );
}

function RemoveEnderecoButton({
  enderecoId,
  clienteId,
}: {
  enderecoId: string;
  clienteId: string;
}) {
  async function handleRemove() {
    const result = await removeEndereco(enderecoId, clienteId);
    if (result?.error) toast.error(result.error);
  }
  return (
    <Button variant="ghost" size="icon-sm" onClick={handleRemove}>
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}

function AddEnderecoDialog({ clienteId }: { clienteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addEndereco.bind(null, clienteId),
    undefined
  );
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Plus className="size-4" />
        Adicionar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo endereço</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="label">Rótulo</Label>
            <Input id="label" name="label" placeholder="Casa, Escritório..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" name="logradouro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero-end">Número</Label>
              <Input id="numero-end" name="numero" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" name="complemento" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" name="bairro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">UF</Label>
              <Input id="estado" name="estado" maxLength={2} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" name="cep" />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
