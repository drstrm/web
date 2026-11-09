/*
 * To Do 공통 규칙
 * ------------------------------------------------------------------
 * 할일은 두 곳에서 그려진다 — 홈 카드(components/TodoList.tsx)와 전체 페이지
 * (components/TodoChecklist.tsx). 둘이 같은 노출 규칙 · 마감 문구 · 「홈에 몇
 * 개까지」를 보도록 여기 모았다.
 *
 * 데이터 자체는 노션에서 온다 (lib/content.ts 의 getTodoList). 서버는 **어느
 * 시간대에서든 보일 수 있는 후보**까지 넓게 내려 주고, 실제로 무엇을 띄울지는
 * 화면이 보는 사람의 시간대 · 지금 시각으로 고른다 (visibleTodos).
 */

import {
  CalendarClock,
  Clock,
  Infinity as InfinityIcon,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import type { TodoItem } from "@/lib/content";
import {
  SEOUL_TZ,
  dayRangeIn,
  formatDateTimeIn,
  formatKstDate,
  formatTimeIn,
  timeZoneLabel,
} from "@/lib/datetime";

const DAY_MS = 86_400_000;

/**
 * 홈 카드에 보여줄 최대 개수.
 *
 * 홈은 「오늘 뭐부터 하지」를 10초 안에 알려주는 자리라 목록이 길어지면 아래
 * 섹션(프로필 · 예약판매)이 화면에서 밀려난다. 넘치는 건 /todo 에서 본다 —
 * 그쪽은 체크박스가 있어서 긴 목록이 오히려 쓸모 있다.
 */
export const HOME_TODO_LIMIT = 5;

/** 판정에 쓰는 실제 끝. 하루 종일 · 시작만 적은 할일은 **그 한국 날짜 하루**가 끝이다 */
const effectiveEnd = (t: Pick<TodoItem, "startMs" | "endMs" | "allDay">) =>
  t.endMs ?? (t.allDay && t.startMs !== undefined ? t.startMs + DAY_MS : undefined);

/**
 * 「오늘 할 일」에 띄울 것인가 — **보는 사람의 하루(day)** 기준.
 *
 * 시작과 끝을 **다른 기준으로** 본다.
 *
 *   시작 — **날짜**로 본다. 현지 오늘 안에 시작하면 시각이 안 됐어도 아침부터
 *          띄운다. 컴백 당일 타임라인(17시 총공 · 18시 스밍)을 미리 알려주는
 *          자리라서다. 몇 시부터인지는 화면이 적어 준다 (deadline).
 *   끝   — **시각**으로 본다. 끝나면 바로 내린다. 할 수 없게 된 일을 남겨 두면
 *          체크 안 된 줄이 쌓여서 「아직 남은 일」이라는 목록의 뜻이 흐려진다.
 *
 * 기간의 뜻:
 *   비움              → 기한 없는 상시 할일 (`투표권 모으기` 처럼 컴백 내내 하는 일)
 *   시작만 (시각)     → 현지 그날 하루
 *   시작+끝           → 그 시각까지 (며칠짜리 기간도 여기서 걸린다)
 *   하루 종일 (날짜)  → **한국의 그 날짜 하루**. 한국 11/9 이면 LA 에서는
 *                       11/8 07:00 ~ 11/9 07:00 이고, 그 구간이 현지 오늘과 겹치면 뜬다
 *
 * 하루 종일 일정을 현지 날짜로 옮기지 않는 이유 — 「11/9 하루 종일」은 대개 한국
 * 시각으로 돌아가는 투표 · 차트의 하루다. 현지 11/9 로 읽으면 이미 끝난 날에 띄우게 된다.
 *
 */
export function showsInTodo(
  t: Pick<TodoItem, "startMs" | "endMs" | "allDay">,
  now: number,
  day: { startMs: number; endMs: number },
): boolean {
  const end = effectiveEnd(t);
  // 기간을 안 적었으면 기한이 없다 — 언제나 보인다
  if (t.startMs === undefined) return end === undefined || end > now;
  // 현지 내일 이후에 시작하는 일은 아직 오늘 할 일이 아니다
  if (t.startMs >= day.endMs) return false;
  // 끝을 안 적었으면 그날 하루 — 현지 오늘 시작하는 것만 남는다
  if (end === undefined) return t.startMs >= day.startMs;
  return end > now;
}

/**
 * 서버가 내려 줄 **후보**인가. 시간대는 UTC-12 ~ UTC+14 라 누군가의 「오늘」은
 * 지금 기준 앞뒤 하루 남짓 안에 있다. ISR 캐시가 몇 분 묵는 것, 탭을 오래 열어
 * 두는 것까지 감안해 이틀씩 여유를 둔다. 끝난 것만은 누구에게도 안 보이니 뺀다.
 */
export function mayShowInTodo(
  t: Pick<TodoItem, "startMs" | "endMs" | "allDay">,
  now: number,
): boolean {
  return showsInTodo(t, now, { startMs: now - 2 * DAY_MS, endMs: now + 2 * DAY_MS });
}

/** 후보 중 지금 · 이 시간대에서 실제로 띄울 할일. 순서는 서버가 정한 그대로 둔다 */
export function visibleTodos(todos: TodoItem[], now: number, timeZone: string): TodoItem[] {
  const day = dayRangeIn(now, timeZone);
  return todos.filter((t) => showsInTodo(t, now, day));
}

/**
 * 시각 표시.
 * · 매일 반복 할일은 마감이 의미가 없다 — 오늘 하면 내일 또 해야 한다.
 * · 시각을 박아 둔 할일은 시작 **전에도 후에도** 그 시각을 보여준다 (starts · started).
 * · 하루 종일 일정은 한국에서는 날짜만, 해외에서는 **현지 시각 구간**으로 보여준다.
 * · 기간을 안 적었으면 상시 할일.
 *
 * 문구가 아니라 **번역 키와 값**을 돌려준다 — 순수 함수라 요청의 언어를
 * 모른다. 화면이 t(`deadline.${key}`) 로 푼다.
 *
 * `timeZone` 은 시각을 읽어 줄 시간대, `now` 는 「시작 전인가」를 가를 시각이다.
 * 한국 시간대가 아니면 시각 뒤에 시간대 이름(「GMT+7」)을 붙인다.
 */
export function deadline(
  todo: TodoItem,
  timeZone: string = SEOUL_TZ,
  now: number = Date.now(),
): {
  icon: LucideIcon;
  key: "daily" | "always" | "due" | "starts" | "started" | "today" | "period";
  /** 문구에 끼울 시각 문자열 (`마감 {due}` · `{due} 시작` · `{due}`) */
  due?: string;
} {
  if (todo.daily) return { icon: Repeat, key: "daily" };
  const korea = timeZone === SEOUL_TZ;
  const zone = (ms: number) => (korea ? "" : ` (${timeZoneLabel(new Date(ms).toISOString(), timeZone)})`);
  const iso = (ms: number) => new Date(ms).toISOString();

  /*
   * 하루 종일 일정을 해외에서 볼 때 — 한국의 그 날짜(들)가 현지 몇 시부터 몇 시까지인지.
   * 날짜만 보여주면 「11.09」를 현지 11/9 로 읽어 하루를 통째로 놓친다.
   */
  if (todo.allDay && !korea && todo.startMs !== undefined) {
    const end = effectiveEnd(todo) ?? todo.startMs + DAY_MS;
    return {
      icon: CalendarClock,
      key: "period",
      due: `${formatDateTimeIn(iso(todo.startMs), timeZone)} ~ ${formatDateTimeIn(iso(end), timeZone)}${zone(end)}`,
    };
  }
  /*
   * 아직 시작하지 않은 할일. 오늘 목록에는 시작 전 할일도 올라오므로 여기서 알고
   * 싶은 것은 마감이 아니라 시작이다. 현지 오늘 시작하는 것만 올라오므로 시각만 적는다.
   * 날짜만 적힌 하루 종일 할일(한국)은 이미 오늘 시작한 것이라 해당 없다.
   */
  if (!todo.allDay && todo.startMs !== undefined && todo.startMs > now) {
    return {
      icon: Clock,
      key: "starts",
      due: formatTimeIn(iso(todo.startMs), timeZone) + zone(todo.startMs),
    };
  }
  /*
   * 시작은 적고 끝은 안 적은 할일 = **그날 하루짜리**다 (showsInTodo).
   * 여기서 「상시」로 적으면 내일이면 사라질 줄을 기한 없는 할일로 읽히게 만든다.
   */
  if (todo.endMs === undefined) {
    if (todo.startMs === undefined) return { icon: InfinityIcon, key: "always" };
    /*
     * 시각을 박아 둔 할일은 시작이 지나도 **몇 시부터인지**를 계속 적는다.
     * 「17:00 시작」이 17시가 되는 순간 「오늘」로 바뀌면, 정작 모일 시각을 보려고
     * 들어온 사람에게서 그 시각을 빼앗는다 — 늦게 본 사람도 몇 시에 시작한 일인지
     * 알아야 따라붙을 수 있다. 하루 종일 할일은 시각 자체가 없으니 「오늘」이 맞다.
     */
    return todo.allDay
      ? { icon: CalendarClock, key: "today" }
      : {
          icon: Clock,
          key: "started",
          due: formatTimeIn(iso(todo.startMs), timeZone) + zone(todo.startMs),
        };
  }
  return {
    icon: CalendarClock,
    key: "due",
    // 한국의 하루 종일 마감은 노션에 적힌 날짜 그대로 (endsAt 은 그날, endMs 는 다음 날 자정)
    due:
      todo.allDay && todo.endsAt
        ? formatKstDate(todo.endsAt)
        : formatDateTimeIn(iso(todo.endMs), timeZone) + zone(todo.endMs),
  };
}
