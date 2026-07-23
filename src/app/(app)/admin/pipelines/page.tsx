import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PipelinesPage() {
  const supabase = await createClient();
  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("id, nome, is_default, etapas(count)")
    .order("created_at");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pipelines</h1>
          <p className="text-sm text-muted-foreground">
            Configure as etapas e o fluxo de vendas do time.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/pipelines/novo" />}>
          Nova pipeline
        </Button>
      </div>

      <div className="space-y-3">
        {pipelines?.map((pipeline) => (
          <Link key={pipeline.id} href={`/admin/pipelines/${pipeline.id}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-medium">
                  {pipeline.nome}
                </CardTitle>
                {pipeline.is_default && <Badge variant="secondary">Padrão</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {pipeline.etapas?.[0]?.count ?? 0} etapa(s)
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {pipelines?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma pipeline criada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
