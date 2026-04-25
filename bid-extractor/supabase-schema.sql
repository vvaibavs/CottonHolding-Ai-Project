-- Run this in Supabase SQL Editor before first deploy

create table public.extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text,
  status text not null default 'pending'
    check (status in ('pending','parsing','extracting','complete','failed')),
  status_message text,
  result jsonb,
  markdown_excerpt text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index on public.extractions (user_id, created_at desc);
alter table public.extractions enable row level security;

create policy "own_select" on public.extractions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own_insert" on public.extractions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own_update" on public.extractions for update to authenticated
  using ((select auth.uid()) = user_id);
create policy "own_delete" on public.extractions for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
  values ('bids', 'bids', false)
  on conflict do nothing;

create policy "own_bid_read" on storage.objects for select to authenticated
  using (bucket_id = 'bids' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_bid_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'bids' and (storage.foldername(name))[1] = auth.uid()::text);
