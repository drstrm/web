-- 라디오 사연 문자 — 날짜별 문장 풀
-- ------------------------------------------------------------------
-- 매일 00시(KST) 예약 작업이 그날 하루치 문장을 넣고(scripts/radio-daily-insert.mjs),
-- 사이트(app/api/radio-message)가 오늘 날짜 줄을 읽어 시간대에 맞는 문장을 뽑는다.
-- 오늘 줄이 없으면 lib/radio-message.ts 의 기본 문장 풀로 돌아간다.
--
-- 수파베이스 SQL Editor 에서 한 번 실행한다. 다시 실행해도 안전하다.

create table if not exists public.radio_messages (
  id          bigint generated always as identity primary key,
  -- KST 날짜. 사이트는 이 날짜의 줄만 본다
  date        date        not null,
  -- lib/radio-message.ts 의 timeSlotOf() 와 같은 이름. all = 시간대 무관
  time_slot   text        not null
              check (time_slot in ('morning', 'lunch', 'afternoon', 'evening', 'night', 'all')),
  -- 자리표시자 ${dj_name} · ${은는} · ${이가} · ${을를} 를 그대로 담는다
  text        text        not null
              check (char_length(text) between 20 and 300),
  -- 생성할 때 반영한 것 (예: "빼빼로데이 · 서울 맑음 3~12℃"). 검수 · 기록용
  context     text,
  created_at  timestamptz not null default now()
);

create index if not exists radio_messages_date_idx on public.radio_messages (date);

-- 읽기는 누구나(사이트의 publishable key), 쓰기는 secret key 만.
-- secret key 는 RLS 를 우회하므로 쓰기 정책은 따로 두지 않는다.
alter table public.radio_messages enable row level security;

drop policy if exists "radio_messages public read" on public.radio_messages;
create policy "radio_messages public read"
  on public.radio_messages
  for select
  to anon, authenticated
  using (true);
