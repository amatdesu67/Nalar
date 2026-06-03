-- Nalar — skema Supabase untuk Sync Riwayat (fitur #17).
-- Jalankan di Supabase Dashboard > SQL Editor.
-- Auth memakai tabel bawaan auth.users (Google + Email magic link).

create table if not exists public.searches (
  id          text primary key,                         -- uuid dari klien
  user_id     uuid not null references auth.users (id) on delete cascade,
  question    text not null,
  consensus   text,
  confidence  int,
  papers      int default 0,
  at          bigint,                                    -- epoch ms (waktu pencarian)
  created_at  timestamptz default now()
);

create index if not exists searches_user_at_idx on public.searches (user_id, at desc);

-- Row Level Security: tiap user hanya bisa mengakses barisnya sendiri.
alter table public.searches enable row level security;

drop policy if exists "own_select" on public.searches;
create policy "own_select" on public.searches
  for select using (auth.uid() = user_id);

drop policy if exists "own_insert" on public.searches;
create policy "own_insert" on public.searches
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_update" on public.searches;
create policy "own_update" on public.searches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_delete" on public.searches;
create policy "own_delete" on public.searches
  for delete using (auth.uid() = user_id);
