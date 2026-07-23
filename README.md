# Human CRM

CRM interno construído com Next.js (App Router) + Supabase (Postgres, Auth, RLS), pensado para dois perfis de uso:

- **Time comercial** — trabalha os negócios no Kanban, cadastra clientes, monta orçamentos com produtos/ofertas.
- **Admin** — configura pipelines/etapas (com % de conversão), catálogo de produtos/preços, e convida contas do time (não existe cadastro público).

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- Supabase: Postgres + Auth + Row Level Security como modelo de segurança
- Tailwind CSS + shadcn/ui (Base UI)
- `@dnd-kit` para o Kanban, `recharts` para os relatórios

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do projeto Supabase
npm run dev
```

Variáveis necessárias em `.env.local` (veja `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` — server-only, nunca exposta ao browser (usada para convidar usuários via `auth.admin.inviteUserByEmail`)
- `NEXT_PUBLIC_SITE_URL` — usada para montar o link de convite/callback

## Banco de dados (Supabase)

O schema completo (tabelas, RLS, triggers, funções de relatório) vive em `supabase/migrations/`. Para aplicar num projeto Supabase já criado:

```bash
supabase link --project-ref <seu-project-ref>
supabase db push --linked --include-seed
```

O seed (`supabase/seed.sql`) cria uma pipeline padrão ("Vendas") com etapas de exemplo e um catálogo de produtos/ofertas de exemplo — não cria clientes/negócios nem usuários.

Para regenerar os tipos TypeScript depois de alterar o schema:

```bash
supabase gen types typescript --linked > src/lib/types/database.types.ts
```

## Primeiro acesso (bootstrap do admin)

Como não existe cadastro público, a primeiríssima conta admin precisa ser criada manualmente uma vez, via Supabase Auth Admin API (com a `SUPABASE_SECRET_KEY`), definindo `role: "admin"` nos metadados do usuário — a partir daí, esse admin já consegue convidar o resto do time pela tela **Usuários** do próprio app.

## Deploy

1. Suba o repositório para o GitHub.
2. Na [Vercel](https://vercel.com/new), importe o repositório.
3. Configure as environment variables do projeto na Vercel com os mesmos valores do `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` apontando para o domínio de produção).
4. Nas configurações de Auth do Supabase (Authentication → URL Configuration), adicione a URL de produção (e de preview, se usar) na lista de **Redirect URLs**, incluindo `/auth/callback`.
5. Rode as migrations (`supabase db push --linked`) contra o projeto Supabase de produção antes ou depois do primeiro deploy — o schema não depende do código da aplicação.
