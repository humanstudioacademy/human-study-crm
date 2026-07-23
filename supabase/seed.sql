-- Dados iniciais: pipeline padrão + etapas, catálogo de exemplo.
-- Não semeamos clientes/negócios aqui porque negocios.owner_id exige um profile
-- real (criado via convite/login no Supabase Auth) — isso acontece depois do deploy.

insert into pipelines (nome, is_default)
values ('Vendas', true);

insert into etapas (pipeline_id, nome, posicao, probabilidade_conversao, is_won_stage, is_lost_stage)
select id, e.nome, e.posicao, e.probabilidade, e.ganho, e.perdido
from pipelines,
  (values
    ('Novo Lead',      0, 10, false, false),
    ('Qualificação',   1, 25, false, false),
    ('Proposta',       2, 50, false, false),
    ('Negociação',     3, 75, false, false),
    ('Fechado - Ganho',4, 100, true, false),
    ('Fechado - Perdido', 5, 0, false, true)
  ) as e(nome, posicao, probabilidade, ganho, perdido)
where pipelines.nome = 'Vendas' and pipelines.is_default = true;

insert into produtos (nome, descricao)
values
  ('Consultoria', 'Consultoria especializada sob demanda'),
  ('Plano de Assinatura', 'Acesso recorrente à plataforma');

insert into ofertas (produto_id, nome, preco_atual)
select p.id, o.nome, o.preco
from produtos p,
  (values
    ('Consultoria', 'Pacote 10h', 2500.00),
    ('Consultoria', 'Pacote 20h', 4500.00),
    ('Plano de Assinatura', 'Plano Mensal', 97.00),
    ('Plano de Assinatura', 'Plano Anual', 997.00)
  ) as o(produto_nome, nome, preco)
where p.nome = o.produto_nome;
