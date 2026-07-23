import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { whatsappLink, mailtoLink } from "@/lib/utils/contact-links";
import { TelefonesSection, EnderecosSection } from "./contato-extra";
import { ClienteInsightSection } from "./cliente-insight";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusLabel: Record<string, string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
};

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (!cliente) notFound();

  const [
    { data: negocios },
    { data: telefones },
    { data: enderecos },
    { data: insight },
  ] = await Promise.all([
    supabase
      .from("negocios")
      .select("id, titulo, valor, status, etapas(nome)")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false }),
    supabase
      .from("cliente_telefones")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at"),
    supabase
      .from("cliente_enderecos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at"),
    supabase
      .from("cliente_insights")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("gerado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar name={cliente.nome} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
            {cliente.empresa && (
              <p className="text-sm text-muted-foreground">
                {cliente.cargo ? `${cliente.cargo} em ` : ""}
                {cliente.empresa}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/clientes/${cliente.id}/editar`} />}
        >
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <div className="flex items-center gap-1.5">
                <p>{cliente.email ?? "—"}</p>
                {cliente.email && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<a href={mailtoLink(cliente.email)} />}
                  >
                    <Mail className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <div className="flex items-center gap-1.5">
                <p>{cliente.telefone ?? "—"}</p>
                {cliente.telefone && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={
                      <a
                        href={whatsappLink(cliente.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <MessageCircle className="size-3.5 text-success" />
                  </Button>
                )}
              </div>
            </div>
            {cliente.observacoes && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap">{cliente.observacoes}</p>
              </div>
            )}
          </div>

          <TelefonesSection clienteId={cliente.id} telefones={telefones ?? []} />
          <EnderecosSection clienteId={cliente.id} enderecos={enderecos ?? []} />
        </CardContent>
      </Card>

      <ClienteInsightSection clienteId={cliente.id} insight={insight} />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">
          Negócios ({negocios?.length ?? 0})
        </h2>
        <ul className="space-y-2">
          {negocios?.map((negocio) => (
            <li key={negocio.id}>
              <Link href={`/negocios/${negocio.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{negocio.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {negocio.etapas?.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {currency.format(negocio.valor)}
                      </span>
                      <Badge
                        variant={
                          negocio.status === "won"
                            ? "secondary"
                            : negocio.status === "lost"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {statusLabel[negocio.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
        {negocios?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum negócio ainda para este cliente.
          </p>
        )}
      </div>
    </div>
  );
}
