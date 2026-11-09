"use client";

import { useSyncExternalStore } from "react";
import { SEOUL_TZ, viewerTimeZone } from "@/lib/datetime";

/*
 * To Do 를 거를 「지금」과 「어느 시간대」
 * ------------------------------------------------------------------
 * 서버는 누가 볼지 모르니 **한국 시간 · 렌더 시각**으로 그린다. 브라우저에 붙은 뒤에는
 * **보는 사람의 시간대 · 지금 시각**으로 다시 거른다 (lib/todo.ts 의 visibleTodos).
 *
 * 둘 다 「처음엔 서버 값, 붙은 뒤에 브라우저 값」이라 useSyncExternalStore 로 읽는다 —
 * 첫 렌더가 서버 HTML 과 같아서 하이드레이션이 어긋나지 않는다.
 *
 * 시각은 1분마다 넘긴다. 탭을 열어 둔 채로 마감이 지나도 그 줄이 내려가고,
 * 현지 자정을 넘기면 다음 날 목록으로 바뀐다. ISR 캐시(300초)가 묵어 있어도
 * 끝난 할일이 남지 않는 덤도 있다.
 */

const MINUTE = 60_000;

function subscribeMinute(onChange: () => void) {
  const id = window.setInterval(onChange, MINUTE);
  // 잠든 탭을 다시 열면 바로 맞춘다 — 인터벌은 백그라운드에서 늦게 돈다
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/** 분 단위로 잘라야 같은 분 안에서는 같은 값이라 다시 그리지 않는다 */
const minuteNow = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** 시간대는 방문 중에 바뀌지 않는다 — 구독할 것이 없다 */
const noSubscribe = () => () => {};
const serverTimeZone = () => SEOUL_TZ;

export function useTodoClock(renderedAt: number): { now: number; timeZone: string } {
  const now = useSyncExternalStore(subscribeMinute, minuteNow, () => renderedAt);
  const timeZone = useSyncExternalStore(noSubscribe, viewerTimeZone, serverTimeZone);
  return { now, timeZone };
}
