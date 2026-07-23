-- CRM interno: Row Level Security
-- Modelo: app 100% interno (sem portal de cliente). Todo usuário autenticado
-- é um funcionário (profiles.role = admin | sales_rep), provisionado só por convite.

-- ============ HELPER FUNCTIONS ============
create or replace function public.is_active_user()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select is_active from profiles where id = auth.uid()),
    false
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' and is_active from profiles where id = auth.uid()),
    false
  )
$$;

-- ============ ENABLE RLS ============
alter table profiles enable row level security;
alter table clientes enable row level security;
alter table pipelines enable row level security;
alter table etapas enable row level security;
alter table produtos enable row level security;
alter table ofertas enable row level security;
alter table oferta_precos enable row level security;
alter table negocios enable row level security;
alter table negocio_ofertas enable row level security;
alter table negocio_historico enable row level security;

-- ============ PROFILES ============
-- leitura liberada a qualquer autenticado ativo (nomes p/ dono do negócio, autor do histórico etc.)
create policy profiles_select on profiles
  for select using (auth.uid() is not null and public.is_active_user());

-- cada um edita a própria linha (ex: nome); admin edita qualquer uma (role/ativação)
create policy profiles_update on profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- insert só via service role (fluxo de convite roda com SUPABASE_SECRET_KEY, que ignora RLS)
-- sem policy de insert para o client autenticado comum.

-- sem policy de delete: contas são desativadas (is_active = false), nunca apagadas.

-- ============ CLIENTES ============
create policy clientes_select on clientes
  for select using (public.is_active_user());
create policy clientes_insert on clientes
  for insert with check (public.is_active_user());
create policy clientes_update on clientes
  for update using (public.is_active_user()) with check (public.is_active_user());
-- sem policy de delete: cliente não é removido (negocios referenciam com on delete restrict).

-- ============ PIPELINES / ETAPAS / PRODUTOS / OFERTAS / OFERTA_PRECOS ============
-- leitura liberada a todo autenticado ativo (o time precisa ver pra montar orçamento e kanban);
-- escrita restrita ao admin (configuração do sistema).
create policy pipelines_select on pipelines for select using (public.is_active_user());
create policy pipelines_write on pipelines for all
  using (public.is_admin()) with check (public.is_admin());

create policy etapas_select on etapas for select using (public.is_active_user());
create policy etapas_write on etapas for all
  using (public.is_admin()) with check (public.is_admin());

create policy produtos_select on produtos for select using (public.is_active_user());
create policy produtos_write on produtos for all
  using (public.is_admin()) with check (public.is_admin());

create policy ofertas_select on ofertas for select using (public.is_active_user());
create policy ofertas_write on ofertas for all
  using (public.is_admin()) with check (public.is_admin());

create policy oferta_precos_select on oferta_precos for select using (public.is_active_user());
create policy oferta_precos_write on oferta_precos for all
  using (public.is_admin()) with check (public.is_admin());

-- ============ NEGOCIOS ============
-- todo mundo do time vê e trabalha todos os negócios (confirmado com o cliente: sem
-- restrição por dono). Delete restrito a admin; update/insert liberado a qualquer ativo.
create policy negocios_select on negocios
  for select using (public.is_active_user());
create policy negocios_insert on negocios
  for insert with check (public.is_active_user());
create policy negocios_update on negocios
  for update using (public.is_active_user()) with check (public.is_active_user());
create policy negocios_delete on negocios
  for delete using (public.is_admin());

-- ============ NEGOCIO_OFERTAS ============
create policy negocio_ofertas_select on negocio_ofertas
  for select using (public.is_active_user());
create policy negocio_ofertas_insert on negocio_ofertas
  for insert with check (public.is_active_user());
create policy negocio_ofertas_update on negocio_ofertas
  for update using (public.is_active_user()) with check (public.is_active_user());
create policy negocio_ofertas_delete on negocio_ofertas
  for delete using (public.is_active_user());

-- ============ NEGOCIO_HISTORICO ============
-- append-only: qualquer autenticado ativo lê e insere (notas manuais); ninguém edita/apaga o passado.
create policy negocio_historico_select on negocio_historico
  for select using (public.is_active_user());
create policy negocio_historico_insert on negocio_historico
  for insert with check (public.is_active_user());
-- sem policy de update/delete: histórico é imutável.
