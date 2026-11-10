-- 라디오 선곡 기록 — 신청곡이 그날 그 채널에서 나왔는가
-- ------------------------------------------------------------------
-- scripts/radio-played-check.mjs 가 방송사 선곡표를 확인해 넣고,
-- 사이트(app/api/radio-message)가 오늘 날짜 줄을 읽어 그 채널 버튼을 「선곡완료」로 막는다.
-- 날짜(KST)로 찾으므로 다음 날이 되면 저절로 다시 신청할 수 있다 — 지울 필요가 없다.
--
-- 수파베이스 SQL Editor 에서 한 번 실행한다. 다시 실행해도 안전하다.
-- 확인 스크립트가 못 잡는 채널(KBS · MBC)은 Table Editor 에서 줄을 직접 넣어도 된다.

create table if not exists public.radio_played (
  id          bigint generated always as identity primary key,
  -- KST 날짜
  date        date        not null,
  -- lib/radio.ts 의 RADIO_STATIONS number ('#1077' …)
  station     text        not null,
  program     text,
  -- 선곡표에 적힌 곡이 나간 시각 (모르면 비워 둔다)
  played_at   timestamptz,
  -- 어디서 확인했나 (선곡표 주소 · 'manual')
  source      text,
  created_at  timestamptz not null default now(),
  unique (date, station)
);

alter table public.radio_played enable row level security;

drop policy if exists "radio_played public read" on public.radio_played;
create policy "radio_played public read"
  on public.radio_played
  for select
  to anon, authenticated
  using (true);
