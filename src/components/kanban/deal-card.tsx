"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import { differenceInDays } from "date-fns";
import { MoreHorizontal, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteNegocio } from "@/lib/actions/negocios.actions";
import { cn } from "@/lib/utils";
import type { KanbanNegocio } from "./types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function DealCard({
  negocio,
  pipelineId,
  isAdmin,
}: {
  negocio: KanbanNegocio;
  pipelineId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: negocio.id,
  });

  const diasParado = differenceInDays(
    new Date(),
    new Date(negocio.stage_entered_at)
  );

  const statusBorder =
    negocio.status === "won"
      ? "border-l-success"
      : negocio.status === "lost"
        ? "border-l-destructive"
        : "border-l-primary/60";

  async function handleDelete() {
    const result = await deleteNegocio(negocio.id, pipelineId);
    if (result?.error) toast.error(result.error);
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group touch-none space-y-2 rounded-lg border border-l-2 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        statusBorder,
        isDragging && "invisible"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/negocios/${negocio.id}`}
          className="block min-w-0 flex-1 truncate font-medium hover:underline"
        >
          {negocio.titulo}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100 data-popup-open:opacity-100">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => router.push(`/negocios/${negocio.id}`)}>
              <ExternalLink className="size-4" />
              Abrir negócio
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {negocio.cliente?.nome}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {currency.format(negocio.valor)}
        </span>
        {negocio.utm_source && (
          <Badge variant="outline" className="text-[10px]">
            {negocio.utm_source}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        {negocio.owner && (
          <div className="flex items-center gap-1.5">
            <UserAvatar name={negocio.owner.full_name} size="sm" />
            <span className="truncate text-[11px] text-muted-foreground">
              {negocio.owner.full_name}
            </span>
          </div>
        )}
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            diasParado >= 7
              ? "bg-warning/15 text-warning"
              : "text-muted-foreground"
          )}
        >
          {diasParado <= 0 ? "hoje" : `${diasParado}d parado`}
        </span>
      </div>
    </div>
  );
}
