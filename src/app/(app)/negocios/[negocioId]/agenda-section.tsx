"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createEvento,
  deleteEvento,
  toggleEventoConcluido,
} from "@/lib/actions/eventos.actions";
import { tipoEventoLabel, tipoEventoIcon } from "@/lib/constants/eventos";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables } from "@/lib/types/database.types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

type Evento = Tables<"eventos"> & { owner: { full_name: string } | null };

export function AgendaSection({
  negocioId,
  eventos,
  onScheduled,
}: {
  negocioId: string;
  eventos: Evento[];
  onScheduled?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Agenda</CardTitle>
        <NovoEventoDialog negocioId={negocioId} onScheduled={onScheduled} />
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {eventos.map((evento) => {
            const Icon = tipoEventoIcon[evento.tipo] ?? CalendarPlus;
            return (
              <li
                key={evento.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p
                      className={
                        evento.concluido
                          ? "font-medium text-muted-foreground line-through"
                          : "font-medium"
                      }
                    >
                      {evento.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tipoEventoLabel[evento.tipo] ?? evento.tipo} ·{" "}
                      {format(new Date(evento.inicio), "d 'de' MMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                      {evento.fim &&
                        ` – ${format(new Date(evento.fim), "HH:mm", { locale: ptBR })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      const result = await toggleEventoConcluido(
                        evento.id,
                        !evento.concluido,
                        `/negocios/${negocioId}`
                      );
                      if (result?.error) toast.error(result.error);
                    }}
                  >
                    {evento.concluido ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Circle className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      const result = await deleteEvento(
                        evento.id,
                        `/negocios/${negocioId}`
                      );
                      if (result?.error) toast.error(result.error);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
          {eventos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum compromisso agendado ainda.
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function NovoEventoDialog({
  negocioId,
  onScheduled,
}: {
  negocioId: string;
  onScheduled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createEvento.bind(null, negocioId, `/negocios/${negocioId}`),
    undefined
  );
  useCloseOnSuccess(state, () => {
    setOpen(false);
    onScheduled?.();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <CalendarPlus className="size-4" />
        Agendar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar compromisso</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              name="tipo"
              items={tipoEventoLabel}
              defaultValue="reuniao"
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tipoEventoLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required placeholder="Ex: Call de proposta" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inicio">Início</Label>
              <Input id="inicio" name="inicio" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Fim</Label>
              <Input id="fim" name="fim" type="datetime-local" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" rows={2} />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Agendando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
