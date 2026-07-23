-- CRM interno: views e funções de apoio aos relatórios.
-- security invoker (padrão): respeita RLS do caller normalmente, sem precisar
-- reimplementar as regras de acesso aqui.

-- ============ TEMPO PARADO (view usada pelos relatórios de funil) ============
create or replace view v_negocio_tempo_parado as
select
  n.*,
  extract(epoch from (now() - n.stage_entered_at)) / 86400 as dias_parado
from negocios n
where n.status = 'open';

-- ============ RESUMO GERAL (valor provisionado, ponderado, contagens) ============
create or replace function public.get_report_resumo(p_pipeline_id uuid default null)
returns table (
  total_aberto numeric,
  total_ponderado numeric,
  quantidade_aberta bigint,
  quantidade_ganha bigint,
  quantidade_perdida bigint,
  valor_ganho numeric
)
language sql
stable
as $$
  select
    coalesce(sum(n.valor) filter (where n.status = 'open'), 0) as total_aberto,
    coalesce(sum(n.valor * e.probabilidade_conversao / 100.0)
      filter (where n.status = 'open'), 0) as total_ponderado,
    count(*) filter (where n.status = 'open') as quantidade_aberta,
    count(*) filter (where n.status = 'won') as quantidade_ganha,
    count(*) filter (where n.status = 'lost') as quantidade_perdida,
    coalesce(sum(n.valor) filter (where n.status = 'won'), 0) as valor_ganho
  from negocios n
  join etapas e on e.id = n.etapa_id
  where p_pipeline_id is null or n.pipeline_id = p_pipeline_id
$$;

-- ============ FUNIL POR ETAPA (quantidade, valor e tempo médio parado) ============
create or replace function public.get_report_funil(p_pipeline_id uuid)
returns table (
  etapa_id uuid,
  etapa_nome text,
  posicao integer,
  probabilidade_conversao numeric,
  quantidade bigint,
  valor_total numeric,
  dias_parado_medio numeric,
  quantidade_parada bigint
)
language sql
stable
as $$
  select
    e.id as etapa_id,
    e.nome as etapa_nome,
    e.posicao,
    e.probabilidade_conversao,
    count(n.id) as quantidade,
    coalesce(sum(n.valor), 0) as valor_total,
    coalesce(
      avg(extract(epoch from (now() - n.stage_entered_at)) / 86400)
        filter (where n.status = 'open'),
      0
    ) as dias_parado_medio,
    count(n.id) filter (
      where n.status = 'open'
        and extract(epoch from (now() - n.stage_entered_at)) / 86400 >= 7
    ) as quantidade_parada
  from etapas e
  left join negocios n on n.etapa_id = e.id
  where e.pipeline_id = p_pipeline_id
  group by e.id, e.nome, e.posicao, e.probabilidade_conversao
  order by e.posicao
$$;

-- ============ QUEBRA POR ORIGEM (UTM) ============
create or replace function public.get_report_utm(p_pipeline_id uuid default null)
returns table (
  utm_source text,
  quantidade bigint,
  valor_total numeric,
  quantidade_ganha bigint,
  valor_ganho numeric
)
language sql
stable
as $$
  select
    coalesce(n.utm_source, '(sem origem)') as utm_source,
    count(*) as quantidade,
    coalesce(sum(n.valor), 0) as valor_total,
    count(*) filter (where n.status = 'won') as quantidade_ganha,
    coalesce(sum(n.valor) filter (where n.status = 'won'), 0) as valor_ganho
  from negocios n
  where p_pipeline_id is null or n.pipeline_id = p_pipeline_id
  group by coalesce(n.utm_source, '(sem origem)')
  order by valor_total desc
$$;
