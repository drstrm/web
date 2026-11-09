/*
 * To Do 공통 규칙
 * ------------------------------------------------------------------
 * 할일은 두 곳에서 그려진다 — 홈 카드(components/TodoList.tsx, 서버)와
 * 전체 페이지(components/TodoChecklist.tsx, 클라이언트). 둘이 같은 마감 문구와
 * 같은 「홈에 몇 개까지」 규칙을 보도록 그 둘만 여기 모았다.
 *
 * 데이터 자체는 노션에서 온다 (lib/content.ts 의 getTodoList).
 */

import {
  CalendarClock,
  Clock,
  Infinity as InfinityIcon,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import type { TodoItem } from "@/lib/content";
import { formatKstDate, formatKstDateTime, formatKstTime } from "@/lib/datetime";

/**
 * 홈 카드에 보여줄 최대 개수.
 *
 * 홈은 「오늘 뭐부터 하지」를 10초 안에 알려주는 자리라 목록이 길어지면 아래
 * 섹션(프로필 · 예약판매)이 화면에서 밀려난다. 넘치는 건 /todo 에서 본다 —
 * 그쪽은 체크박스가 있어서 긴 목록이 오히려 쓸모 있다.
 */
export const HOME_TODO_LIMIT = 5;

/**
 * 시각 표시.
 * · 매일 반복 할일은 마감이 의미가 없다 — 오늘 하면 내일 또 해야 한다.
 * · 아직 시작 안 한 할일은 **몇 시부터**를 보여준다 (아래).
 * · 하루 종일 일정은 시각을 떼고, 기간을 안 적었으면 상시 할일.
 *
 * 문구가 아니라 **번역 키와 값**을 돌려준다 — 순수 함수라 요청의 언어를
 * 모른다. 화면이 t(`deadline.${key}`) 로 푼다.
 */
export function deadline(todo: TodoItem): {
  icon: LucideIcon;
  key: "daily" | "always" | "due" | "starts" | "today";
  /** 문구에 끼울 시각 문자열 (`마감 {due}` · `{due} 시작`) */
  due?: string;
} {
  if (todo.daily) return { icon: Repeat, key: "daily" };
  /*
   * 아직 시작하지 않은 할일. 오늘 목록에는 시작 전 할일도 올라오므로
   * (lib/content.ts 의 showsInTodo) 여기서 알고 싶은 것은 마감이 아니라 시작이다.
   * 날짜만 적힌 하루 종일 할일은 이미 오늘 시작한 것이라 해당 없다.
   *
   * 판정 시각은 렌더 시점이다 — ISR 캐시가 풀릴 때까지 최대 몇 분은 「시작 전」으로
   * 남을 수 있는데, 목록에 보이는 것 자체는 달라지지 않으므로 그 정도는 감수한다.
   */
  if (!todo.allDay && todo.startsAt && Date.parse(todo.startsAt) > Date.now()) {
    return { icon: Clock, key: "starts", due: formatKstTime(todo.startsAt) };
  }
  /*
   * 시작은 적고 끝은 안 적은 할일 = **그날 하루짜리**다 (lib/content.ts 의 showsInTodo).
   * 여기서 「상시」로 적으면 내일이면 사라질 줄을 기한 없는 할일로 읽히게 만든다.
   */
  if (!todo.endsAt) {
    return todo.startsAt
      ? { icon: CalendarClock, key: "today" }
      : { icon: InfinityIcon, key: "always" };
  }
  return {
    icon: CalendarClock,
    key: "due",
    due: todo.allDay ? formatKstDate(todo.endsAt) : formatKstDateTime(todo.endsAt),
  };
}
