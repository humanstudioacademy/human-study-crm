import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";
import { createClient } from "@/lib/supabase/server";

const AI_MODEL = "claude-opus-4-8";

const NegocioInsightSchema = z.object({
  resumo: z.string().describe("Resumo objetivo do estado atual do negócio, em até 3 frases."),
  pontos_atencao: z
    .string()
    .nullable()
    .describe("Riscos, objeções ou sinais de alerta identificados. Null se não houver nenhum."),
  proxima_acao_sugerida: z
    .string()
    .describe("Próxima ação concreta que o vendedor deveria tomar."),
  sentimento: z
    .enum(["positivo", "neutro", "negativo"])
    .describe("Sentimento geral do andamento da negociação."),
});

export async function generateNegocioInsight(negocioId: string) {
  const supabase = await createClient();

  const [{ data: negocio }, { data: historico }, { data: ofertas }, { data: eventos }] =
    await Promise.all([
      supabase
        .from("negocios")
        .select(
          "titulo, descricao, valor, status, stage_entered_at, cliente:clientes(nome, empresa), etapa:etapas(nome)"
        )
        .eq("id", negocioId)
        .single(),
      supabase
        .from("negocio_historico")
        .select("tipo, descricao, created_at")
        .eq("negocio_id", negocioId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("negocio_ofertas")
        .select("quantidade, preco_unitario_snapshot, oferta:ofertas(nome)")
        .eq("negocio_id", negocioId),
      supabase
        .from("eventos")
        .select("tipo, titulo, descricao, inicio, concluido")
        .eq("negocio_id", negocioId)
        .order("inicio", { ascending: false })
        .limit(15),
    ]);

  if (!negocio) return;

  const prompt = `Analise este negócio de um CRM de vendas e gere um insight.

Título: ${negocio.titulo}
Cliente: ${negocio.cliente?.nome ?? "—"}${negocio.cliente?.empresa ? ` (${negocio.cliente.empresa})` : ""}
Etapa atual: ${negocio.etapa?.nome ?? "—"}
Status: ${negocio.status}
Valor: R$ ${negocio.valor}
Observações registradas: ${negocio.descricao ?? "—"}

Ofertas associadas:
${ofertas?.map((o) => `- ${o.oferta?.nome ?? "?"} (qtd ${o.quantidade}, R$ ${o.preco_unitario_snapshot})`).join("\n") || "Nenhuma"}

Reuniões, ligações e outros compromissos agendados (mais novo primeiro):
${eventos?.map((e) => `- [${e.tipo}] ${e.titulo}${e.descricao ? ` — ${e.descricao}` : ""} em ${e.inicio} (${e.concluido ? "concluído" : "pendente"})`).join("\n") || "Nenhum compromisso agendado"}

Histórico e observações adicionadas (mais novo primeiro):
${historico?.map((h) => `- [${h.tipo}] ${h.descricao ?? ""}`).join("\n") || "Nenhum evento registrado"}`;

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system:
      "Você é um assistente de vendas B2B que analisa negócios de um CRM e produz insights objetivos e acionáveis em português do Brasil.",
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(NegocioInsightSchema) },
  });

  if (!response.parsed_output) return;

  await supabase.from("negocio_insights").insert({
    negocio_id: negocioId,
    resumo: response.parsed_output.resumo,
    pontos_atencao: response.parsed_output.pontos_atencao,
    proxima_acao_sugerida: response.parsed_output.proxima_acao_sugerida,
    sentimento: response.parsed_output.sentimento,
  });
}

const ClienteAnaliseSchema = z.object({
  analise: z
    .string()
    .describe(
      "Análise completa do cliente em texto corrido (parágrafos), cobrindo perfil, padrão de negociação, histórico de negócios e recomendações."
    ),
});

export async function generateClienteAnalise(
  clienteId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const [{ data: cliente }, { data: negocios }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", clienteId).single(),
    supabase
      .from("negocios")
      .select(
        "titulo, valor, status, created_at, etapa:etapas(nome), negocio_historico(tipo, descricao, created_at)"
      )
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false }),
  ]);

  if (!cliente) return { error: "Cliente não encontrado." };

  const prompt = `Analise este cliente de um CRM de vendas e produza uma análise completa.

Nome: ${cliente.nome}
Empresa: ${cliente.empresa ?? "—"}
Cargo: ${cliente.cargo ?? "—"}
Observações cadastradas: ${cliente.observacoes ?? "—"}

Negócios (${negocios?.length ?? 0}):
${
  negocios
    ?.map(
      (n) =>
        `- "${n.titulo}" · ${n.status} · R$ ${n.valor} · etapa: ${n.etapa?.nome ?? "—"}\n` +
        (n.negocio_historico ?? [])
          .slice(0, 5)
          .map((h) => `    · [${h.tipo}] ${h.descricao ?? ""}`)
          .join("\n")
    )
    .join("\n") || "Nenhum negócio ainda."
}`;

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system:
      "Você é um assistente de vendas B2B que analisa clientes de um CRM e produz análises completas e acionáveis em português do Brasil.",
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(ClienteAnaliseSchema) },
  });

  if (!response.parsed_output) return { error: "A IA não retornou uma análise válida." };

  const { error } = await supabase.from("cliente_insights").insert({
    cliente_id: clienteId,
    analise: response.parsed_output.analise,
  });

  if (error) return { error: "Não foi possível salvar a análise." };
  return {};
}
