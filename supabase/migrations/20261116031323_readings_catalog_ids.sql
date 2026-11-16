-- Switch readings to the ids used by backend/app/catalog (merged from the original app):
--   spread  'three_card' -> 'three', plus the Lenormand spreads
--   reader  'high_priestess' -> 'high-priestess'
--   cards   'major-00' -> 'fool', 'cups-05' -> 'five-of-cups'; position labels -> position ids
-- and store the AI follow-up suggestions (US-10).

alter table public.readings drop constraint readings_spread_check;
alter table public.readings drop constraint readings_reader_check;
alter table public.readings alter column reader drop default;

create function pg_temp.catalog_card_id(old_id text) returns text
language sql immutable as $$
  select case
    when old_id ~ '^major-\d\d$' then (array[
      'fool', 'magician', 'high-priestess', 'empress', 'emperor', 'hierophant', 'lovers',
      'chariot', 'strength', 'hermit', 'wheel-of-fortune', 'justice', 'hanged-man', 'death',
      'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement', 'world'
    ])[substring(old_id from 7)::int + 1]
    when old_id ~ '^(wands|cups|swords|pentacles)-\d\d$' then (array[
      'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'page', 'knight', 'queen', 'king'
    ])[split_part(old_id, '-', 2)::int] || '-of-' || split_part(old_id, '-', 1)
    else old_id
  end
$$;

create function pg_temp.catalog_position(label text) returns text
language sql immutable as $$
  select case label
    when '今日' then 'today'
    when '過去' then 'past'
    when '現在' then 'present'
    when '未來' then 'future'
    else label
  end
$$;

update public.readings
set
  spread = case spread when 'three_card' then 'three' else spread end,
  reader = replace(reader, '_', '-'),
  cards = (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'position', pg_temp.catalog_position(card ->> 'position'),
        'card_id', pg_temp.catalog_card_id(card ->> 'card_id'),
        'reversed', coalesce((card ->> 'reversed')::boolean, false)
      ) order by ordinality
    ), '[]'::jsonb)
    from jsonb_array_elements(cards) with ordinality as t(card, ordinality)
  );

alter table public.readings
  add constraint readings_spread_check
    check (spread in ('daily', 'three', 'lenormand-three', 'lenormand-nine')),
  add constraint readings_reader_check
    check (reader in ('high-priestess', 'magician', 'fool')),
  alter column reader set default 'high-priestess';

-- Generated once per reading so reopening it does not call the AI again (US-10 AC3).
alter table public.readings
  add column suggestions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(suggestions) = 'array' and jsonb_array_length(suggestions) <= 3);
