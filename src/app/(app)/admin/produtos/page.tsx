import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProdutosPage() {
  const supabase = await createClient();
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, descricao, is_active, ofertas(count)")
    .order("created_at");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de produtos e ofertas com preço.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/produtos/novo" />}>
          Novo produto
        </Button>
      </div>

      <div className="space-y-3">
        {produtos?.map((produto) => (
          <Link key={produto.id} href={`/admin/produtos/${produto.id}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-medium">
                  {produto.nome}
                </CardTitle>
                {!produto.is_active && <Badge variant="outline">Inativo</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {produto.ofertas?.[0]?.count ?? 0} oferta(s)
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {produtos?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum produto cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
