"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, TriangleAlert, ArrowRight, Loader2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateNegocio } from "@/lib/actions/negocios.actions";
import type { ActionState } from "@/lib/actions/pipelines.actions";
import type { Tables, Json } from "@/lib/types/database.types";
import { OfertasSection } from "./ofertas-section";
import { HistoricoSection } from "./historico-section";
import { AgendaSection } from "./agenda-section";

type Negocio = Tables<"negocios"> & {
  cliente: { id: string; nome: string; empresa: string | null } | null;
  etapa: { nome: string } | null;
  owner: { full_name: string } | null;
};

type Submissao = {
  dados: Json;
  formulario: {
    nome: string;
    campos: { chave: string; rotulo: string }[];
  } | null;
} | null;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusLabel: Record<string, string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
};

const utmFields: { key: keyof Negocio; label: string }[] = [
  { key: "utm_source", label: "Source" },
  { key: "utm_campaign", label: "Campaign" },
  { key: "utm_medium", label: "Medium" },
  { key: "utm_term", label: "Term" },
  { key: "utm_content", label: "Content" },
];

const sentimentoStyle: Record<string, string> = {
  positivo: "text-success",
  neutro: "text-muted-foreground",
  negativo: "text-destructive",
};

export function NegocioDetail({
  negocio,
  outrosNegocios,
  historico,
  negocioOfertas,
  ofertasDisponiveis,
  insight,
  eventos,
  submissao,
}: {
  negocio: Negocio;
  outrosNegocios: Pick<Tables<"negocios">, "id" | "titulo" | "valor" | "status">[];
  historico: (Tables<"negocio_historico"> & {
    autor: { full_name: string } | null;
  })[];
  negocioOfertas: (Tables<"negocio_ofertas"> & {
    oferta: { nome: string; produto: { nome: string } | null } | null;
  })[];
  ofertasDisponiveis: {
    id: string;
    nome: string;
    preco_atual: number;
    produto: { nome: string } | null;
  }[];
  insight: Tables<"negocio_insights"> | null;
  eventos: (Tables<"eventos"> & { owner: { full_name: string } | null })[];
  submissao: Submissao;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateNegocio.bind(null, negocio.id),
    undefined
  );

  const [titulo, setTitulo] = useState(negocio.titulo);
  const [descricao, setDescricao] = useState(negocio.descricao ?? "");
  const [valorManual, setValorManual] = useState(String(negocio.valor_manual));
  const [status, setStatus] = useState(negocio.status);
  const [savingState, setSavingState] = useState<"idle" | "pending" | "saved">(
    "idle"
  );

  const [insightGenerating, setInsightGenerating] = useState(false);
  const [lastInsightId, setLastInsightId] = useState(insight?.id ?? null);

  const skipNextAutosave = useRef(true);

  function save(overrides?: Partial<{ status: string }>) {
    const fd = new FormData();
    fd.set("titulo", titulo);
    fd.set("descricao", descricao);
    fd.set("valor", valorManual || "0");
    fd.set("status", overrides?.status ?? status);
    setSavingState("pending");
    setInsightGenerating(true);
    formAction(fd);
  }

  // Autosave com debounce para título/descrição/valor manual.
  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    const timeout = setTimeout(() => save(), 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- salva com os valores atuais de todos os campos, mas só deve re-disparar quando o texto muda
  }, [titulo, descricao, valorManual]);

  useEffect(() => {
    if (state?.success) {
      setSavingState("saved");
      const timeout = setTimeout(() => setSavingState("idle"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  // Insight chegou (id novo) -> para de mostrar "gerando".
  useEffect(() => {
    if (insight?.id && insight.id !== lastInsightId) {
      setLastInsightId(insight.id);
      setInsightGenerating(false);
    }
  }, [insight, lastInsightId]);

  // Enquanto um insight está sendo gerado em segundo plano, faz polling
  // (router.refresh) até ele aparecer ou até estourar o tempo máximo de espera.
  useEffect(() => {
    if (!insightGenerating) return;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      router.refresh();
      if (count >= 12) {
        clearInterval(interval);
        setInsightGenerating(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [insightGenerating, router]);

  const diasParado = differenceInDays(
    new Date(),
    new Date(negocio.stage_entered_at)
  );
  const hasUtm = utmFields.some((f) => negocio[f.key]);
  const dados = (submissao?.dados ?? null) as Record<string, string> | null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{negocio.titulo}</h1>
            <Badge variant="secondary">{negocio.etapa?.nome}</Badge>
          </div>
          {negocio.cliente && (
            <p className="text-sm text-muted-foreground">
              Cliente:{" "}
              <Link
                href={`/clientes/${negocio.cliente.id}`}
                className="underline"
              >
                {negocio.cliente.nome}
              </Link>
              {negocio.cliente.empresa && ` · ${negocio.cliente.empresa}`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Responsável: {negocio.owner?.full_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xl font-semibold">
            {currency.format(negocio.valor)}
          </span>
          <Badge
            variant={diasParado >= 7 ? "outline" : "secondary"}
            className={diasParado >= 7 ? "text-amber-600" : ""}
          >
            {diasParado <= 0 ? "Movimentado hoje" : `${diasParado}d parado`}
          </Badge>
        </div>
      </div>

      {(insight || insightGenerating) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Insight de IA
              {insightGenerating ? (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Gerando novo insight...
                </span>
              ) : (
                insight && (
                  <span
                    className={`ml-auto text-xs font-normal ${sentimentoStyle[insight.sentimento ?? "neutro"] ?? "text-muted-foreground"}`}
                  >
                    {insight.sentimento}
                  </span>
                )
              )}
            </CardTitle>
          </CardHeader>
          {insight && !insightGenerating && (
            <CardContent className="space-y-3 text-sm">
              <p>{insight.resumo}</p>
              {insight.pontos_atencao && (
                <p className="flex items-start gap-1.5 text-amber-500">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {insight.pontos_atencao}
                </p>
              )}
              {insight.proxima_acao_sugerida && (
                <p className="flex items-start gap-1.5 text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0" />
                  {insight.proxima_acao_sugerida}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Gerado{" "}
                {formatDistanceToNow(new Date(insight.gerado_em), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {dados && submissao?.formulario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-muted-foreground" />
              Enviado via formulário "{submissao.formulario.nome}"
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(dados)
              .filter(([, valor]) => valor)
              .map(([chave, valor]) => {
                const rotulo =
                  submissao.formulario?.campos.find((c) => c.chave === chave)
                    ?.rotulo ??
                  { nome: "Nome", email: "E-mail", telefone: "Telefone" }[
                    chave
                  ] ??
                  chave;
                return (
                  <div key={chave}>
                    <p className="text-xs text-muted-foreground">{rotulo}</p>
                    <p>{valor}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Dados do negócio</CardTitle>
          <span className="text-xs text-muted-foreground">
            {savingState === "pending" && "Salvando..."}
            {savingState === "saved" && "Salvo automaticamente"}
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Observações</Label>
              <Textarea
                id="descricao"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Anotações sobre o andamento do negócio — a IA usa isso nos insights."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor manual (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min={0}
                  value={valorManual}
                  onChange={(e) => setValorManual(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Usado só quando não há produtos/ofertas associados — o total
                  acima já reflete a soma automática.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  items={{ open: "Em aberto", won: "Ganho", lost: "Perdido" }}
                  value={status}
                  onValueChange={(value) => {
                    if (!value) return;
                    setStatus(value as typeof status);
                    save({ status: value });
                  }}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Em aberto</SelectItem>
                    <SelectItem value="won">Ganho</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                {status !== "open" && (
                  <p className="text-xs text-muted-foreground">
                    Move automaticamente para a etapa de fechamento
                    correspondente.
                  </p>
                )}
              </div>
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>

          {hasUtm && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Origem (UTM)</p>
                <div className="flex flex-wrap gap-2">
                  {utmFields.map(
                    (f) =>
                      negocio[f.key] && (
                        <Badge key={f.key} variant="outline">
                          {f.label}: {String(negocio[f.key])}
                        </Badge>
                      )
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OfertasSection
        negocioId={negocio.id}
        negocioOfertas={negocioOfertas}
        ofertasDisponiveis={ofertasDisponiveis}
      />

      <AgendaSection
        negocioId={negocio.id}
        eventos={eventos}
        onScheduled={() => setInsightGenerating(true)}
      />

      {outrosNegocios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">
            Outros negócios de {negocio.cliente?.nome}
          </h2>
          <ul className="space-y-2">
            {outrosNegocios.map((outro) => (
              <li key={outro.id}>
                <Link href={`/negocios/${outro.id}`}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex items-center justify-between py-3">
                      <span className="font-medium">{outro.titulo}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {currency.format(outro.valor)}
                        </span>
                        <Badge variant="secondary">
                          {statusLabel[outro.status]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <HistoricoSection
        negocioId={negocio.id}
        historico={historico}
        onNotaAdded={() => setInsightGenerating(true)}
      />
    </div>
  );
}
