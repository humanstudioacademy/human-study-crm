import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clientes")
    .select("id, nome, email, telefone, empresa")
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

      <form className="max-w-sm">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome..."
          type="search"
        />
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Telefone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes?.map((cliente) => (
            <TableRow key={cliente.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link href={`/clientes/${cliente.id}`} className="block">
                  {cliente.nome}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.empresa ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.email ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.telefone ?? "—"}
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
