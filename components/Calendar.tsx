"use client";

import { useMemo, useState } from "react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import type { CalendarEvent } from "@/lib/content";
import { emojiOf } from "@/lib/kind-emoji";

/**
 * 홈 캘린더 (월간 그리드)
 * ------------------------------------------------------------------
 * 일정 데이터는 공용 `schedules` 테이블에서 옵니다(lib/content.ts).
 * · recurring = true (데뷔일 · 생일): 연도를 무시하고 월-일만 비교해 매년 표시
 * · recurring = false (투표 기간 · 차트 마감): 연도까지 일치할 때만 표시하며,
 *   endDate 가 있으면 시작~종료일 사이의 모든 날짜에 표시
 */

/** kind 별 기본 이모지는 To Do 리스트와 공유한다(lib/kind-emoji.ts) */
const emoji = (e: CalendarEvent) => emojiOf(e.type, e.emoji);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" → UTC 타임스탬프 (시간대 영향 없이 날짜만 비교) */
function toUTC(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 기간 일정 표시용: "9.1 ~ 9.7" */
function formatRange(e: CalendarEvent) {
  const [, sm, sd] = e.date.split("-").map(Number);
  if (!e.endDate) return `${sm}.${sd}`;
  const [, em, ed] = e.endDate.split("-").map(Number);
  return `${sm}.${sd} ~ ${em}.${ed}`;
}

/** 서버(UTC)·클라이언트(로컬) 렌더 결과를 맞추기 위해 KST 기준 '오늘'을 계산 */
function seoulToday() {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return { y, m, d };
}

export default function Calendar({ events }: { events: CalendarEvent[] }) {
  const today = useMemo(() => seoulToday(), []);
  const [cursor, setCursor] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<number | null>(today.d);

  const firstWeekday = new Date(Date.UTC(cursor.y, cursor.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();

  /**
   * 현재 보고 있는 달의 "일 → 이벤트 목록" 매핑(byDay)과
   * 하단 목록용 이번 달 일정(monthList, 기간 일정도 1건으로 집계)
   */
  const { byDay, monthList } = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    const list: { day: number; event: CalendarEvent }[] = [];
    const push = (day: number, e: CalendarEvent) =>
      map.set(day, [...(map.get(day) ?? []), e]);

    for (const e of events) {
      const [, em, ed] = e.date.split("-").map(Number);

      if (e.recurring) {
        // 매년 반복: 월-일만 비교 (2/29 처럼 해당 달에 없는 날짜는 건너뜀)
        if (em !== cursor.m || ed > daysInMonth) continue;
        push(ed, e);
        list.push({ day: ed, event: e });
        continue;
      }

      // 특정 연도 일정: 이번 달과 겹치는 구간만 표시
      const from = Math.max(toUTC(e.date), Date.UTC(cursor.y, cursor.m - 1, 1));
      const to = Math.min(
        toUTC(e.endDate ?? e.date),
        Date.UTC(cursor.y, cursor.m - 1, daysInMonth),
      );
      if (from > to) continue;
      for (let t = from; t <= to; t += DAY_MS) push(new Date(t).getUTCDate(), e);
      list.push({ day: new Date(from).getUTCDate(), event: e });
    }

    list.sort((a, b) => a.day - b.day);
    return { byDay: map, monthList: list };
  }, [events, cursor, daysInMonth]);
  // 앞쪽 빈칸 + 날짜 수를 7의 배수로 맞춰 마지막 주까지 채웁니다.
  const cells = Array.from(
    { length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 },
    (_, i) => {
      const day = i - firstWeekday + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    },
  );

  const isThisMonth = cursor.y === today.y && cursor.m === today.m;

  const moveMonth = (delta: number) => {
    const next = new Date(Date.UTC(cursor.y, cursor.m - 1 + delta, 1));
    setCursor({ y: next.getUTCFullYear(), m: next.getUTCMonth() + 1 });
    setSelected(null);
  };

  const goToday = () => {
    setCursor({ y: today.y, m: today.m });
    setSelected(today.d);
  };

  const selectedEvents = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div>
      {/* 월 이동 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          aria-label="이전 달"
          className="grid h-8 w-8 place-items-center rounded-full border text-sm hover:bg-sky-50"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold">
            {cursor.y}년 {cursor.m}월
          </span>
          {!isThisMonth && (
            <button
              type="button"
              onClick={goToday}
              className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-600 hover:bg-sky-100"
            >
              오늘
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          aria-label="다음 달"
          className="grid h-8 w-8 place-items-center rounded-full border text-sm hover:bg-sky-50"
        >
          ›
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1.5 ${i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : ""}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

          const dayEvents = byDay.get(day) ?? [];
          const isToday = isThisMonth && day === today.d;
          const isSelected = day === selected;
          const weekday = i % 7;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(isSelected ? null : day)}
              aria-label={`${cursor.m}월 ${day}일${dayEvents.length ? `, 일정 ${dayEvents.length}건` : ""}`}
              aria-pressed={isSelected}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-xs transition-colors ${
                isSelected
                  ? "border-sky-400 bg-sky-50"
                  : dayEvents.length
                    ? "border-transparent bg-sky-50/60 hover:bg-sky-50"
                    : "border-transparent hover:bg-sky-50/50"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full font-bold ${
                  isToday
                    ? "sky-gradient text-white"
                    : weekday === 0
                      ? "text-rose-400"
                      : weekday === 6
                        ? "text-sky-500"
                        : ""
                }`}
              >
                {day}
              </span>
              <span className="flex h-3 items-center gap-px text-[9px] leading-none">
                {dayEvents.slice(0, 3).map((e) => (
                  <span key={e.id}>{emoji(e)}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택한 날짜 / 이번 달 일정 */}
      <div className="mt-4 border-t pt-4">
        {selected ? (
          <>
            <p className="mb-2 text-xs font-bold text-sky-600">
              {cursor.m}월 {selected}일
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-muted">등록된 일정이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md text-base">
                      <PlatformIcon iconType={e.iconType} size={24} fallback={emoji(e)} />
                    </span>
                    {e.url ? (
                      <SmartLink
                        href={e.url}
                        className="text-sm font-semibold text-sky-600 underline underline-offset-2"
                      >
                        {e.label}
                      </SmartLink>
                    ) : (
                      <span className="text-sm font-semibold">{e.label}</span>
                    )}
                    {e.endDate && (
                      <span className="ml-auto shrink-0 text-xs text-muted">
                        {formatRange(e)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : monthList.length === 0 ? (
          <p className="text-xs text-muted">{cursor.m}월에는 등록된 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {monthList.map(({ day, event }) => (
              <li key={event.id} className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md text-base">
                  <PlatformIcon iconType={event.iconType} size={24} fallback={emoji(event)} />
                </span>
                <span className="truncate text-sm font-semibold">{event.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted">
                  {event.endDate ? formatRange(event) : `${cursor.m}.${day}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
