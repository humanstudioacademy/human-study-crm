"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KanbanNegocio } from "./types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function DealCard({ negocio }: { negocio: KanbanNegocio }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: negocio.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const diasParado = differenceInDays(
    new Date(),
    new Date(negocio.stage_entered_at)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none space-y-2 rounded-lg border bg-card p-3 shadow-sm",
        isDragging && "opacity-50"
      )}
    >
      <Link
        href={`/negocios/${negocio.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="block font-medium hover:underline"
      >
        {negocio.titulo}
      </Link>
      <p className="text-xs text-muted-foreground">{negocio.cliente?.nome}</p>
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
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{negocio.owner?.full_name}</span>
        <span className={cn(diasParado >= 7 && "font-medium text-amber-600")}>
          {diasParado <= 0 ? "hoje" : `${diasParado}d parado`}
        </span>
      </div>
    </div>
  );
}
