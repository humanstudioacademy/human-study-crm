-- CRM v2: transições de etapa, telefones/endereços de cliente, insights de IA,
-- agenda (eventos/tarefas) e construtor de formulários públicos.

-- ============ ETAPA_TRANSICOES ============
-- Grafo de "para onde essa etapa pode ir". Etapa sem nenhuma linha aqui = sem
-- restrição (qualquer transição permitida — comportamento atual preservado).
create table etapa_transicoes (
  id uuid primary key default gen_random_uuid(),
  etapa_origem_id uuid not null references etapas(id) on delete cascade,
  etapa_destino_id uuid not null references etapas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (etapa_origem_id, etapa_destino_id),
  check (etapa_origem_id != etapa_destino_id)
);
create index idx_etapa_transicoes_origem on etapa_transicoes(etapa_origem_id);

-- ============ CLIENTE_TELEFONES / CLIENTE_ENDERECOS ============
-- Adicionais aos campos únicos clientes.telefone/clientes.email, que continuam
-- sendo o contato principal.
create table cliente_telefones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  numero text not null,
  tipo text not null default 'celular',
  principal boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_cliente_telefones_cliente on cliente_telefones(cliente_id);

create table cliente_enderecos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  label text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  principal boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_cliente_enderecos_cliente on cliente_enderecos(cliente_id);

-- ============ NEGOCIO_INSIGHTS / CLIENTE_INSIGHTS (IA) ============
create table negocio_insights (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  resumo text not null,
  pontos_atencao text,
  proxima_acao_sugerida text,
  sentimento text,
  gerado_em timestamptz not null default now()
);
create index idx_negocio_insights_negocio on negocio_insights(negocio_id, gerado_em desc);

create table cliente_insights (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  analise text not null,
  gerado_em timestamptz not null default now()
);
create index idx_cliente_insights_cliente on cliente_insights(cliente_id, gerado_em desc);

-- ============ EVENTOS / TAREFAS (agenda) ============
create type evento_tipo as enum ('reuniao', 'ligacao', 'outro');

create table eventos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete restrict,
  tipo evento_tipo not null default 'reuniao',
  titulo text not null,
  descricao text,
  inicio timestamptz not null,
  fim timestamptz,
  concluido boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_eventos_owner_inicio on eventos(owner_id, inicio);
create index idx_eventos_negocio on eventos(negocio_id);

create table tarefas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete restrict,
  titulo text not null,
  descricao text,
  prazo timestamptz,
  concluida boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tarefas_owner_prazo on tarefas(owner_id, prazo);
create index idx_tarefas_negocio on tarefas(negocio_id);

create trigger trg_eventos_updated_at before update on eventos
  for each row execute function public.set_updated_at();
create trigger trg_tarefas_updated_at before update on tarefas
  for each row execute function public.set_updated_at();

-- ============ FORMULARIOS (construtor de captura de lead público) ============
create table formularios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  descricao text,
  pipeline_id uuid not null references pipelines(id) on delete restrict,
  etapa_id uuid not null references etapas(id) on delete restrict,
  owner_padrao_id uuid not null references profiles(id) on delete restrict,
  ativo boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_formularios_slug on formularios(slug);

create type campo_tipo as enum ('texto', 'email', 'telefone', 'numero', 'select', 'textarea');

create table formulario_campos (
  id uuid primary key default gen_random_uuid(),
  formulario_id uuid not null references formularios(id) on delete cascade,
  chave text not null,
  rotulo text not null,
  tipo campo_tipo not null default 'texto',
  obrigatorio boolean not null default false,
  opcoes jsonb,
  mapeia_para text,
  posicao integer not null default 0,
  created_at timestamptz not null default now(),
  unique (formulario_id, chave)
);
create index idx_formulario_campos_formulario on formulario_campos(formulario_id, posicao);

create table formulario_submissoes (
  id uuid primary key default gen_random_uuid(),
  formulario_id uuid not null references formularios(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  negocio_id uuid references negocios(id) on delete set null,
  dados jsonb not null,
  utm_source text,
  utm_campaign text,
  utm_medium text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default now()
);
create index idx_formulario_submissoes_formulario on formulario_submissoes(formulario_id, created_at desc);

create trigger trg_formularios_updated_at before update on formularios
  for each row execute function public.set_updated_at();

-- ============ RLS ============
alter table etapa_transicoes enable row level security;
alter table cliente_telefones enable row level security;
alter table cliente_enderecos enable row level security;
alter table negocio_insights enable row level security;
alter table cliente_insights enable row level security;
alter table eventos enable row level security;
alter table tarefas enable row level security;
alter table formularios enable row level security;
alter table formulario_campos enable row level security;
alter table formulario_submissoes enable row level security;

-- Configuração do sistema: leitura para todo autenticado, escrita só admin.
create policy etapa_transicoes_select on etapa_transicoes
  for select using (public.is_active_user());
create policy etapa_transicoes_write on etapa_transicoes for all
  using (public.is_admin()) with check (public.is_admin());

create policy formularios_select on formularios
  for select using (public.is_active_user());
create policy formularios_write on formularios for all
  using (public.is_admin()) with check (public.is_admin());

create policy formulario_campos_select on formulario_campos
  for select using (public.is_active_user());
create policy formulario_campos_write on formulario_campos for all
  using (public.is_admin()) with check (public.is_admin());

-- Submissões: qualquer autenticado pode ler (admin acompanha as entradas);
-- inserção só via client de service role no envio público (sem policy de
-- insert para o papel authenticated).
create policy formulario_submissoes_select on formulario_submissoes
  for select using (public.is_active_user());

-- Dados de trabalho do time: leitura e escrita liberadas a todo autenticado,
-- mesmo padrão de clientes/negocios.
create policy cliente_telefones_all on cliente_telefones for all
  using (public.is_active_user()) with check (public.is_active_user());
create policy cliente_enderecos_all on cliente_enderecos for all
  using (public.is_active_user()) with check (public.is_active_user());
create policy negocio_insights_select on negocio_insights
  for select using (public.is_active_user());
create policy negocio_insights_insert on negocio_insights
  for insert with check (public.is_active_user());
create policy cliente_insights_select on cliente_insights
  for select using (public.is_active_user());
create policy cliente_insights_insert on cliente_insights
  for insert with check (public.is_active_user());
create policy eventos_all on eventos for all
  using (public.is_active_user()) with check (public.is_active_user());
create policy tarefas_all on tarefas for all
  using (public.is_active_user()) with check (public.is_active_user());

-- ============ ENFORCEMENT DE TRANSIÇÃO DE ETAPA (defesa em profundidade) ============
-- Estende o trigger existente de troca de etapa: se a etapa de origem tiver
-- alguma linha em etapa_transicoes, só permite ir para os destinos listados.
-- Sem nenhuma linha para a origem = sem restrição (preserva o comportamento
-- anterior). A checagem também é feita no Server Action, mas fica aqui como
-- última barreira contra updates diretos via client.
create or replace function public.on_negocios_before_update()
returns trigger language plpgsql as $$
declare
  tem_restricao boolean;
  transicao_permitida boolean;
begin
  new.updated_at = now();

  if new.etapa_id is distinct from old.etapa_id then
    select exists(select 1 from etapa_transicoes where etapa_origem_id = old.etapa_id)
      into tem_restricao;

    if tem_restricao then
      select exists(
        select 1 from etapa_transicoes
        where etapa_origem_id = old.etapa_id and etapa_destino_id = new.etapa_id
      ) into transicao_permitida;

      if not transicao_permitida then
        raise exception 'Transição de etapa não permitida a partir da etapa atual.';
      end if;
    end if;

    new.stage_entered_at = now();
    insert into negocio_historico (negocio_id, tipo, autor_id, descricao, dados_anteriores, dados_novos)
    values (
      old.id,
      'etapa_alterada',
      auth.uid(),
      format('Etapa alterada de "%s" para "%s"',
        (select nome from etapas where id = old.etapa_id),
        (select nome from etapas where id = new.etapa_id)),
      jsonb_build_object('etapa_id', old.etapa_id),
      jsonb_build_object('etapa_id', new.etapa_id)
    );
  end if;

  if new.status is distinct from old.status then
    if old.status = 'open' and new.status in ('won', 'lost') then
      new.closed_at = now();
    elsif new.status = 'open' then
      new.closed_at = null;
    end if;

    insert into negocio_historico (negocio_id, tipo, autor_id, descricao, dados_anteriores, dados_novos)
    values (
      old.id,
      'status_alterado',
      auth.uid(),
      format('Status alterado de "%s" para "%s"', old.status, new.status),
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;

  return new;
end;
$$;
