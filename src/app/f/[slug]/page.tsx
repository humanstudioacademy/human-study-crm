import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormularioPublico } from "./formulario-publico";

export default async function FormularioPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const admin = createAdminClient();

  const { data: formulario } = await admin
    .from("formularios")
    .select("*, campos:formulario_campos(*)")
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (!formulario) notFound();

  const utms = {
    utm_source: typeof search.utm_source === "string" ? search.utm_source : "",
    utm_campaign:
      typeof search.utm_campaign === "string" ? search.utm_campaign : "",
    utm_medium: typeof search.utm_medium === "string" ? search.utm_medium : "",
    utm_term: typeof search.utm_term === "string" ? search.utm_term : "",
    utm_content:
      typeof search.utm_content === "string" ? search.utm_content : "",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-2">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-semibold">{formulario.nome}</h1>
          {formulario.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">
              {formulario.descricao}
            </p>
          )}
        </div>
        <FormularioPublico
          slug={slug}
          campos={[...(formulario.campos ?? [])].sort(
            (a, b) => a.posicao - b.posicao
          )}
          utms={utms}
        />
      </div>
    </div>
  );
}
