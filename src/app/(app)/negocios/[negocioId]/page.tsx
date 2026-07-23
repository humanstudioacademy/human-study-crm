import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/getSession";
import { NegocioDetail } from "./negocio-detail";

export default async function NegocioDetailPage({
  params,
}: {
  params: Promise<{ negocioId: string }>;
}) {
  const { negocioId } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data: negocio } = await supabase
    .from("negocios")
    .select(
      "*, cliente:clientes(id, nome, empresa), etapa:etapas(nome), owner:profiles!negocios_owner_id_fkey(full_name)"
    )
    .eq("id", negocioId)
    .single();

  if (!negocio) notFound();

  const [
    { data: outrosNegocios },
    { data: historico },
    { data: negocioOfertas },
    { data: ofertasDisponiveis },
  ] = await Promise.all([
    supabase
      .from("negocios")
      .select("id, titulo, valor, status")
      .eq("cliente_id", negocio.cliente_id)
      .neq("id", negocioId)
      .order("created_at", { ascending: false }),
    supabase
      .from("negocio_historico")
      .select("*, autor:profiles(full_name)")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: false }),
    supabase
      .from("negocio_ofertas")
      .select("*, oferta:ofertas(nome, produto:produtos(nome))")
      .eq("negocio_id", negocioId),
    supabase
      .from("ofertas")
      .select("id, nome, preco_atual, produto:produtos(nome)")
      .eq("is_active", true)
      .order("nome"),
  ]);

  return (
    <NegocioDetail
      negocio={negocio}
      outrosNegocios={outrosNegocios ?? []}
      historico={historico ?? []}
      negocioOfertas={negocioOfertas ?? []}
      ofertasDisponiveis={ofertasDisponiveis ?? []}
    />
  );
}
