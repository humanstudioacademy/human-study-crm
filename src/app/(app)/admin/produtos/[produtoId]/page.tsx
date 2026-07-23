import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProdutoEditor } from "./produto-editor";

export default async function ProdutoDetailPage({
  params,
}: {
  params: Promise<{ produtoId: string }>;
}) {
  const { produtoId } = await params;
  const supabase = await createClient();

  const { data: produto } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", produtoId)
    .single();

  if (!produto) notFound();

  const { data: ofertas } = await supabase
    .from("ofertas")
    .select("*")
    .eq("produto_id", produtoId)
    .order("created_at");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <ProdutoEditor produto={produto} ofertas={ofertas ?? []} />
    </div>
  );
}
