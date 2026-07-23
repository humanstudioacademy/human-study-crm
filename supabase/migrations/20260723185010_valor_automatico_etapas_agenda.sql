-- Automação: valor do negócio a partir das ofertas, com fallback manual;
-- movimentação automática para a etapa de fechamento ao marcar ganho/perdido;
-- tipos adicionais de evento de agenda (e-mail, visita presencial).

-- ============ VALOR AUTOMÁTICO (ofertas) COM FALLBACK MANUAL ============
alter table negocios add column valor_manual numeric not null default 0;
update negocios set valor_manual = valor;

create or replace function public.recalc_negocio_valor(p_negocio_id uuid)
returns void language plpgsql as $$
declare
  v_soma numeric;
  v_count integer;
begin
  select coalesce(sum(quantidade * preco_unitario_snapshot), 0), count(*)
    into v_soma, v_count
    from negocio_ofertas
    where negocio_id = p_negocio_id;

  if v_count > 0 then
    update negocios set valor = v_soma where id = p_negocio_id;
  else
    update negocios set valor = valor_manual where id = p_negocio_id;
  end if;
end;
$$;

create or replace function public.on_negocio_oferta_valor_changed()
returns trigger language plpgsql as $$
begin
  perform public.recalc_negocio_valor(coalesce(new.negocio_id, old.negocio_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_negocio_oferta_valor_sync
  after insert or update or delete on negocio_ofertas
  for each row execute function public.on_negocio_oferta_valor_changed();

-- ============ NEGOCIOS: won/lost move automaticamente + sync do valor manual ============
-- Reescreve o trigger de before-update (mesma função de sempre) somando:
--   1. status -> won/lost move a etapa para a etapa de fechamento correspondente
--      da própria pipeline (ignora a checagem de transições, é um atalho de negócio,
--      não um drag manual);
--   2. valor_manual alterado com o negócio sem nenhuma oferta associada reflete
--      direto em valor (a soma de ofertas sempre tem prioridade quando existe).
create or replace function public.on_negocios_before_update()
returns trigger language plpgsql as $$
declare
  tem_restricao boolean;
  transicao_permitida boolean;
  v_etapa_alvo uuid;
  v_auto_status_move boolean := false;
begin
  new.updated_at = now();

  if new.status is distinct from old.status and new.status in ('won', 'lost') then
    select id into v_etapa_alvo
      from etapas
      where pipeline_id = new.pipeline_id
        and (
          (new.status = 'won' and is_won_stage)
          or (new.status = 'lost' and is_lost_stage)
        )
      limit 1;

    if v_etapa_alvo is not null and v_etapa_alvo is distinct from new.etapa_id then
      new.etapa_id = v_etapa_alvo;
      v_auto_status_move := true;
    end if;
  end if;

  if new.etapa_id is distinct from old.etapa_id then
    if not v_auto_status_move then
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

  if new.valor_manual is distinct from old.valor_manual then
    if not exists(select 1 from negocio_ofertas where negocio_id = new.id) then
      new.valor = new.valor_manual;
    end if;
  end if;

  return new;
end;
$$;

-- ============ AGENDA: novos tipos de evento ============
alter type evento_tipo add value if not exists 'email';
alter type evento_tipo add value if not exists 'visita';
