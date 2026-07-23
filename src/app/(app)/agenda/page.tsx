import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  parse,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tipoEventoLabel, tipoEventoIcon as tipoIcon } from "@/lib/constants/eventos";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await requireUser();
  const { mes } = await searchParams;

  const referencia = mes ? parse(mes, "yyyy-MM", new Date()) : new Date();
  const inicioMes = startOfMonth(referencia);
  const fimMes = endOfMonth(referencia);
  const inicioGrade = startOfWeek(inicioMes);
  const fimGrade = endOfWeek(fimMes);
  const dias = eachDayOfInterval({ start: inicioGrade, end: fimGrade });

  const supabase = await createClient();
  const { data: eventos } = await supabase
    .from("eventos")
    .select("*, negocio:negocios(id, titulo)")
    .eq("owner_id", user.id)
    .gte("inicio", inicioGrade.toISOString())
    .lte("inicio", fimGrade.toISOString())
    .order("inicio");

  const eventosPorDia = new Map<string, typeof eventos>();
  for (const evento of eventos ?? []) {
    const key = format(new Date(evento.inicio), "yyyy-MM-dd");
    const lista = eventosPorDia.get(key) ?? [];
    lista.push(evento);
    eventosPorDia.set(key, lista);
  }

  const mesAnterior = format(subMonths(referencia, 1), "yyyy-MM");
  const proximoMes = format(addMonths(referencia, 1), "yyyy-MM");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Seus compromissos: reuniões, ligações, e-mails e visitas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            nativeButton={false}
            render={<Link href={`/agenda?mes=${mesAnterior}`} />}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium capitalize">
            {format(referencia, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            nativeButton={false}
            render={<Link href={`/agenda?mes=${proximoMes}`} />}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <div
            key={dia}
            className="bg-muted/40 p-2 text-center font-medium text-muted-foreground"
          >
            {dia}
          </div>
        ))}
        {dias.map((dia) => {
          const key = format(dia, "yyyy-MM-dd");
          const eventosDoDia = eventosPorDia.get(key) ?? [];
          const foraDoMes = !isSameMonth(dia, referencia);
          return (
            <div
              key={key}
              className={cn(
                "min-h-28 space-y-1 bg-card p-2",
                foraDoMes && "bg-card/40 text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-xs",
                  isToday(dia) && "bg-primary font-semibold text-primary-foreground"
                )}
              >
                {format(dia, "d")}
              </span>
              <div className="space-y-1">
                {eventosDoDia.slice(0, 3).map((evento) => {
                  const Icon = tipoIcon[evento.tipo] ?? CalendarPlus;
                  return (
                    <Link
                      key={evento.id}
                      href={evento.negocio_id ? `/negocios/${evento.negocio_id}` : "#"}
                      className={cn(
                        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px]",
                        evento.concluido
                          ? "bg-muted text-muted-foreground line-through"
                          : "bg-primary/15 text-foreground"
                      )}
                      title={evento.titulo}
                    >
                      <Icon className="size-3 shrink-0" />
                      <span className="truncate">{evento.titulo}</span>
                    </Link>
                  );
                })}
                {eventosDoDia.length > 3 && (
                  <p className="px-1 text-[11px] text-muted-foreground">
                    +{eventosDoDia.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Próximos compromissos</h2>
        <ul className="space-y-2">
          {(eventos ?? [])
            .filter((e) => !e.concluido && new Date(e.inicio) >= new Date())
            .slice(0, 8)
            .map((evento) => {
              const Icon = tipoIcon[evento.tipo] ?? CalendarPlus;
              return (
                <li
                  key={evento.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {tipoEventoLabel[evento.tipo] ?? evento.tipo} ·{" "}
                      {format(new Date(evento.inicio), "d 'de' MMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                      {evento.negocio && ` · ${evento.negocio.titulo}`}
                    </p>
                  </div>
                  {evento.negocio_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/negocios/${evento.negocio_id}`} />}
                    >
                      Ver negócio
                    </Button>
                  )}
                </li>
              );
            })}
          {(eventos ?? []).filter(
            (e) => !e.concluido && new Date(e.inicio) >= new Date()
          ).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum compromisso futuro agendado.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}
