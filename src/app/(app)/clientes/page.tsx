import Link from "next/link";
import { Search, Mail, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { whatsappLink, mailtoLink } from "@/lib/utils/contact-links";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clientes")
    .select("id, nome, email, telefone, empresa, negocios(count)")
    .order("nome");

  if (q) query = query.ilike("nome", `%${q}%`);

  const { data: clientes } = await query;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cada cliente pode ter vários negócios ao longo do tempo.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/clientes/novo" />}>
          Novo cliente
        </Button>
      </div>

      <form className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome..."
          type="search"
          className="pl-8"
        />
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Negócios</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes?.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="flex items-center gap-2"
                >
                  <UserAvatar name={cliente.nome} size="sm" />
                  {cliente.nome}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.empresa ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex flex-col text-xs">
                  <span>{cliente.email ?? "—"}</span>
                  <span>{cliente.telefone ?? "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {cliente.negocios?.[0]?.count ?? 0}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {clientes?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum cliente encontrado.
        </p>
      )}
    </div>
  );
}
