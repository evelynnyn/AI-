-- Tarot readings saved per signed-in user (US-13, US-14, US-15).
create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question text not null check (char_length(question) between 1 and 200),
  spread text not null check (spread in ('daily', 'three_card')),
  reader text not null default 'high_priestess'
    check (reader in ('high_priestess', 'magician', 'fool')),
  -- [{ "position": "過去", "card_id": "major-00", "reversed": false }, ...]
  cards jsonb not null check (jsonb_typeof(cards) = 'array'),
  -- AI interpretation; null means not generated yet or failed (US-15 can retry).
  interpretation text,
  -- [{ "question": "...", "answer": "..." }, ...], at most 5 (US-09)
  follow_ups jsonb not null default '[]'::jsonb
    check (jsonb_typeof(follow_ups) = 'array' and jsonb_array_length(follow_ups) <= 5),
  created_at timestamptz not null default now()
);

create index readings_user_id_created_at_idx on public.readings (user_id, created_at desc);

alter table public.readings enable row level security;

create policy "Users can read their own readings"
  on public.readings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own readings"
  on public.readings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own readings"
  on public.readings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own readings"
  on public.readings for delete
  to authenticated
  using ((select auth.uid()) = user_id);
