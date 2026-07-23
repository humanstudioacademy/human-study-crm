-- CRM interno: triggers e funções de suporte
-- Mantém profiles em sincronia com auth.users, histórico do negócio, tempo-na-etapa
-- e histórico de preço das ofertas automaticamente.

-- ============ updated_at automático ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function public.set_updated_at();
create trigger trg_clientes_updated_at before update on clientes
  for each row execute function public.set_updated_at();
create trigger trg_pipelines_updated_at before update on pipelines
  for each row execute function public.set_updated_at();
create trigger trg_etapas_updated_at before update on etapas
  for each row execute function public.set_updated_at();
create trigger trg_produtos_updated_at before update on produtos
  for each row execute function public.set_updated_at();
create trigger trg_ofertas_updated_at before update on ofertas
  for each row execute function public.set_updated_at();
-- negocios tem sua própria lógica de updated_at (ver trg_negocios_before_update abaixo).

-- ============ NOVO USUÁRIO: profiles espelha auth.users ============
-- Preenchido a partir dos metadados passados no convite (auth.admin.inviteUserByEmail).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'sales_rep')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ NEGOCIOS: criação registra histórico ============
create or replace function public.on_negocio_criado()
returns trigger language plpgsql as $$
begin
  insert into negocio_historico (negocio_id, tipo, autor_id, descricao, dados_novos)
  values (
    new.id,
    'criado',
    auth.uid(),
    format('Negócio criado na etapa "%s"', (select nome from etapas where id = new.etapa_id)),
    jsonb_build_object('etapa_id', new.etapa_id, 'valor', new.valor, 'status', new.status)
  );
  return new;
end;
$$;

create trigger trg_negocio_criado
  after insert on negocios
  for each row execute function public.on_negocio_criado();

-- ============ NEGOCIOS: troca de etapa/status atualiza tempo-parado e histórico ============
create or replace function public.on_negocios_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();

  if new.etapa_id is distinct from old.etapa_id then
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

create trigger trg_negocios_before_update
  before update on negocios
  for each row execute function public.on_negocios_before_update();

-- ============ NEGOCIO_OFERTAS: adicionar/remover oferta registra histórico ============
create or replace function public.on_negocio_oferta_added()
returns trigger language plpgsql as $$
begin
  insert into negocio_historico (negocio_id, tipo, autor_id, descricao, dados_novos)
  values (
    new.negocio_id,
    'oferta_adicionada',
    auth.uid(),
    format('Oferta "%s" adicionada (qtd. %s, R$ %s cada)',
      (select nome from ofertas where id = new.oferta_id),
      new.quantidade, new.preco_unitario_snapshot),
    jsonb_build_object(
      'oferta_id', new.oferta_id,
      'quantidade', new.quantidade,
      'preco_unitario_snapshot', new.preco_unitario_snapshot
    )
  );
  return new;
end;
$$;

create trigger trg_negocio_oferta_added
  after insert on negocio_ofertas
  for each row execute function public.on_negocio_oferta_added();

create or replace function public.on_negocio_oferta_removed()
returns trigger language plpgsql as $$
begin
  insert into negocio_historico (negocio_id, tipo, autor_id, descricao, dados_anteriores)
  values (
    old.negocio_id,
    'oferta_removida',
    auth.uid(),
    format('Oferta "%s" removida', (select nome from ofertas where id = old.oferta_id)),
    jsonb_build_object(
      'oferta_id', old.oferta_id,
      'quantidade', old.quantidade,
      'preco_unitario_snapshot', old.preco_unitario_snapshot
    )
  );
  return old;
end;
$$;

create trigger trg_negocio_oferta_removed
  after delete on negocio_ofertas
  for each row execute function public.on_negocio_oferta_removed();

-- ============ OFERTAS: preço inicial vira o primeiro registro de histórico ============
create or replace function public.on_oferta_criada()
returns trigger language plpgsql as $$
begin
  insert into oferta_precos (oferta_id, preco, valido_desde, created_by)
  values (new.id, new.preco_atual, now(), auth.uid());
  return new;
end;
$$;

create trigger trg_oferta_criada
  after insert on ofertas
  for each row execute function public.on_oferta_criada();

-- ============ RPC: troca de preço de oferta (atômica, admin-only) ============
-- Fecha o preço vigente (valido_ate) e abre um novo, sincronizando ofertas.preco_atual.
create or replace function public.set_oferta_preco(p_oferta_id uuid, p_novo_preco numeric)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem alterar preços.';
  end if;

  if p_novo_preco < 0 then
    raise exception 'Preço não pode ser negativo.';
  end if;

  update oferta_precos
    set valido_ate = now()
    where oferta_id = p_oferta_id and valido_ate is null;

  insert into oferta_precos (oferta_id, preco, valido_desde, created_by)
  values (p_oferta_id, p_novo_preco, now(), auth.uid());

  update ofertas
    set preco_atual = p_novo_preco, updated_at = now()
    where id = p_oferta_id;
end;
$$;
