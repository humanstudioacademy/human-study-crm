import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineFilter } from "./pipeline-filter";
import { FunilChart } from "./funil-chart";
import { UtmChart } from "./utm-chart";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ pipelineId?: string }>;
}) {
  const supabase = await createClient();

  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("id, nome")
    .order("created_at");

  const { pipelineId: requestedId } = await searchParams;
  const pipelineId = requestedId ?? pipelines?.[0]?.id;

  const [{ data: resumo }, { data: funil }, { data: utm }] = await Promise.all([
    supabase.rpc("get_report_resumo", { p_pipeline_id: pipelineId ?? undefined }),
    pipelineId
      ? supabase.rpc("get_report_funil", { p_pipeline_id: pipelineId })
      : Promise.resolve({ data: [] }),
    supabase.rpc("get_report_utm", { p_pipeline_id: pipelineId ?? undefined }),
  ]);

  const stats = resumo?.[0];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Provisionado, avanço por etapa e origem dos negócios.
          </p>
        </div>
        <PipelineFilter pipelines={pipelines ?? []} currentId={pipelineId} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Provisionado (aberto)"
          value={currency.format(stats?.total_aberto ?? 0)}
        />
        <StatCard
          label="Ponderado por probabilidade"
          value={currency.format(stats?.total_ponderado ?? 0)}
        />
        <StatCard
          label="Negócios abertos"
          value={String(stats?.quantidade_aberta ?? 0)}
        />
        <StatCard
          label="Ganhos"
          value={`${stats?.quantidade_ganha ?? 0} · ${currency.format(stats?.valor_ganho ?? 0)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Avançando x parado por etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunilChart data={funil ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Origem (UTM source)</CardTitle>
        </CardHeader>
        <CardContent>
          <UtmChart data={utm ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
