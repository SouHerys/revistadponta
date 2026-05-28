-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.magazines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  description text,
  pdf_url text not null,
  cover_url text,
  issue_label text,
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.toc_items (
  id uuid primary key default gen_random_uuid(),
  magazine_id uuid not null references public.magazines(id) on delete cascade,
  title text not null,
  page integer not null default 1,
  description text,
  position integer not null default 0
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists magazines_updated_at on public.magazines;
create trigger magazines_updated_at
before update on public.magazines
for each row execute procedure public.set_updated_at();

alter table public.magazines enable row level security;
alter table public.toc_items enable row level security;

-- Leitura pública somente das edições publicadas.
drop policy if exists "public read published magazines" on public.magazines;
create policy "public read published magazines"
on public.magazines for select
to anon, authenticated
using (published = true or auth.role() = 'authenticated');

drop policy if exists "public read toc of published magazines" on public.toc_items;
create policy "public read toc of published magazines"
on public.toc_items for select
to anon, authenticated
using (
  exists (
    select 1 from public.magazines m
    where m.id = toc_items.magazine_id
    and (m.published = true or auth.role() = 'authenticated')
  )
);

-- Admin: qualquer usuário autenticado pode gerenciar. Para equipe maior, crie uma tabela de perfis/admins.
drop policy if exists "authenticated manage magazines" on public.magazines;
create policy "authenticated manage magazines"
on public.magazines for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage toc" on public.toc_items;
create policy "authenticated manage toc"
on public.toc_items for all
to authenticated
using (true)
with check (true);

-- Storage: crie o bucket no painel se este insert falhar por permissão.
insert into storage.buckets (id, name, public)
values ('revistas', 'revistas', true)
on conflict (id) do nothing;

-- Leitura pública dos arquivos.
drop policy if exists "public read revista files" on storage.objects;
create policy "public read revista files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'revistas');

-- Upload/edição somente autenticado.
drop policy if exists "authenticated manage revista files" on storage.objects;
create policy "authenticated manage revista files"
on storage.objects for all
to authenticated
using (bucket_id = 'revistas')
with check (bucket_id = 'revistas');
