-- CRM interno: schema inicial
-- Tabelas, enums e índices. RLS e triggers ficam em migrations separadas.

create extension if not exists pg_trgm;

-- ============ ENUMS ============
create type user_role as enum ('admin', 'sales_rep');
create type deal_status as enum ('open', 'won', 'lost');
create type historico_tipo as enum (
  'criado',
  'etapa_alterada',
  'status_alterado',
  'nota',
  'campo_alterado',
  'oferta_adicionada',
  'oferta_removida'
);

-- ============ PROFILES ============
-- espelha auth.users; criada automaticamente por trigger (ver migration de triggers)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'sales_rep',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ CLIENTES ============
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  empresa text,
  cargo text,
  observacoes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_clientes_nome_trgm on clientes using gin (nome gin_trgm_ops);

-- ============ PIPELINES ============
create table pipelines (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ ETAPAS ============
create table etapas (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  nome text not null,
  posicao integer not null,
  probabilidade_conversao numeric(5,2) not null default 0
    check (probabilidade_conversao >= 0 and probabilidade_conversao <= 100),
  is_won_stage boolean not null default false,
  is_lost_stage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, posicao)
);
create index idx_etapas_pipeline on etapas(pipeline_id);

-- ============ PRODUTOS ============
create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ OFERTAS ============
-- preco_atual é denormalizado (leitura rápida); a fonte da verdade histórica é oferta_precos
create table ofertas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete cascade,
  nome text not null,
  preco_atual numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_ofertas_produto on ofertas(produto_id);

-- ============ OFERTA_PRECOS (histórico de preço) ============
create table oferta_precos (
  id uuid primary key default gen_random_uuid(),
  oferta_id uuid not null references ofertas(id) on delete cascade,
  preco numeric(12,2) not null,
  valido_desde timestamptz not null default now(),
  valido_ate timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_oferta_precos_oferta on oferta_precos(oferta_id, valido_desde desc);
-- invariante (garantida pela função set_oferta_preco, ver migration de triggers):
-- no máximo uma linha por oferta_id com valido_ate is null
create unique index idx_oferta_precos_vigente on oferta_precos(oferta_id) where valido_ate is null;

-- ============ NEGOCIOS (deals) ============
create table negocios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  pipeline_id uuid not null references pipelines(id) on delete restrict,
  etapa_id uuid not null references etapas(id) on delete restrict,
  owner_id uuid not null references profiles(id) on delete restrict,
  titulo text not null,
  descricao text,
  valor numeric(12,2) not null default 0,
  status deal_status not null default 'open',
  utm_source text,
  utm_campaign text,
  utm_medium text,
  utm_term text,
  utm_content text,
  stage_entered_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_negocios_cliente on negocios(cliente_id);
create index idx_negocios_pipeline_etapa on negocios(pipeline_id, etapa_id);
create index idx_negocios_owner on negocios(owner_id);
create index idx_negocios_status on negocios(status);
create index idx_negocios_utm_source on negocios(utm_source);
create index idx_negocios_titulo_trgm on negocios using gin (titulo gin_trgm_ops);

-- ============ NEGOCIO_OFERTAS (join negocio <-> oferta) ============
create table negocio_ofertas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  oferta_id uuid not null references ofertas(id) on delete restrict,
  quantidade integer not null default 1 check (quantidade > 0),
  preco_unitario_snapshot numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (negocio_id, oferta_id)
);
create index idx_negocio_ofertas_negocio on negocio_ofertas(negocio_id);

-- ============ NEGOCIO_HISTORICO (timeline / auditoria) ============
create table negocio_historico (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  tipo historico_tipo not null,
  autor_id uuid references profiles(id) on delete set null,
  descricao text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz not null default now()
);
create index idx_negocio_historico_negocio on negocio_historico(negocio_id, created_at desc);
