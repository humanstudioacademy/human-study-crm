import { ClienteForm } from "../cliente-form";
import { createCliente } from "@/lib/actions/clientes.actions";

export default function NovoClientePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Novo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre o contato antes de criar um negócio para ele.
        </p>
      </div>
      <ClienteForm action={createCliente} submitLabel="Criar cliente" />
    </div>
  );
}
