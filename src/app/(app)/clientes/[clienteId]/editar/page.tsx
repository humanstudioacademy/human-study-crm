import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCliente } from "@/lib/actions/clientes.actions";
import { ClienteForm } from "../../cliente-form";

export default async function EditarClientePage({
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
      </div>
      <ClienteForm
        action={updateCliente.bind(null, clienteId)}
        cliente={cliente}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
