import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FormulariosPage() {
  const supabase = await createClient();
  const { data: formularios } = await supabase
    .from("formularios")
    .select(
      "id, nome, slug, ativo, pipeline:pipelines(nome), formulario_submissoes(count)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Formulários</h1>
          <p className="text-sm text-muted-foreground">
            Capture leads com formulários públicos, sem exigir login.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/formularios/novo" />}>
          Novo formulário
        </Button>
      </div>

      <div className="space-y-3">
        {formularios?.map((formulario) => (
          <Card key={formulario.id} className="transition-colors hover:bg-muted/40">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <Link href={`/admin/formularios/${formulario.id}`}>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <FileText className="size-4 text-muted-foreground" />
                  {formulario.nome}
                </CardTitle>
              </Link>
              {!formulario.ativo && <Badge variant="outline">Inativo</Badge>}
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {formulario.pipeline?.nome} ·{" "}
                {formulario.formulario_submissoes?.[0]?.count ?? 0} envio(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                render={<a href={`/f/${formulario.slug}`} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="size-3.5" />
                /f/{formulario.slug}
              </Button>
            </CardContent>
          </Card>
        ))}
        {formularios?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum formulário cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
