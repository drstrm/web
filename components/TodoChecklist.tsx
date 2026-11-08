"use client";

import { Check, CircleCheckBig } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useSyncExternalStore } from "react";
import KindIcon from "@/components/KindIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, EmptyState, IconTile, Notice } from "@/components/ui";
import type { TodoItem } from "@/lib/content";
import { toSeoulDate } from "@/lib/datetime";
import { deadline } from "@/lib/todo";
import { cn } from "@/lib/utils";

/**
 * /todo — 체크할 수 있는 전체 To Do List
 * ------------------------------------------------------------------
 * 홈 카드(components/TodoList.tsx)는 앞 몇 개만 보여준다. 이 화면은 지금
 * 진행중인 할일을 **전부** 늘어놓고, 끝낸 것을 체크해 둘 수 있게 한다.
 *
 * 체크는 **이 브라우저에만** 남는다 (localStorage). 로그인이 없는 사이트라
 * 서버에 둘 자리가 없고, 둔다 해도 누구의 체크인지 알 방법이 없다. 기기마다
 * 따로 체크하는 대신 계정 · 동의 · 개인정보가 전부 필요 없어진다.
 */

/** localStorage 키. 날짜를 **값에** 담아 키 하나만 쓴다 — 날짜별 키를 쌓으면 지워 줄 사람이 없다 */
const STORAGE_KEY = "drstrm-todo-checks";

type Saved = { date: string; ids: string[] };

/**
 * 체크가 초기화되는 기준일은 **한국 시간**이다.
 * 마감이 전부 KST 라(투표 자정 마감 · 차트 집계) 보는 사람의 시간대로 끊으면
 * 해외 팬의 체크가 한국의 하루와 어긋난다.
 */
const seoulToday = () => toSeoulDate(new Date().toISOString());

/*
 * 체크 저장소
 * ------------------------------------------------------------------
 * React 상태가 아니라 **브라우저 저장소를 그대로 읽는다** (useSyncExternalStore).
 * 서버가 그린 HTML 은 localStorage 를 모르니 전부 안 눌린 상태여야 하는데,
 * 그 「처음엔 비어 있고 붙은 뒤에 채워진다」가 바로 이 훅이 다루는 일이다.
 * 덤으로 같은 사이트를 두 탭에 열어 둬도 한쪽의 체크가 다른 쪽에 따라온다.
 */

const listeners = new Set<() => void>();

/** 저장이 막힌 브라우저(시크릿 모드 등)에서도 이번 방문의 체크는 살아 있게 하는 대비책 */
let memory: string | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 다른 탭 · 다른 창에서 누른 체크
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 저장된 원문(JSON 문자열). 문자열이라 값이 같으면 다시 그리지 않는다 */
function getSnapshot(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return raw;
  } catch {
    // 저장소 접근 자체가 막힌 브라우저 — 아래 memory 로 떨어진다
  }
  return memory ?? "";
}

/** 서버는 누가 무엇을 체크했는지 모른다 — 전부 안 눌린 상태로 그린다 */
const getServerSnapshot = () => "";

function saveChecks(today: string, ids: string[]) {
  const raw = JSON.stringify({ date: today, ids } satisfies Saved);
  memory = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // 저장이 막혀도 이번 방문의 체크는 memory 로 화면에 남는다
  }
  for (const notify of listeners) notify();
}

/** 저장된 원문 → 오늘의 체크 목록. 어제 체크는 되살리지 않는다 (매일 다시 해야 하는 할일이다) */
function parseChecks(raw: string, today: string): string[] {
  if (!raw) return [];
  try {
    const saved = JSON.parse(raw) as Saved;
    return saved?.date === today && Array.isArray(saved.ids) ? saved.ids : [];
  } catch {
    return [];
  }
}

export default function TodoChecklist({ todos }: { todos: TodoItem[] }) {
  // 목록 콜백의 `t`(TodoItem)와 겹치지 않게 번역기는 tr 로 둔다
  const tr = useTranslations("todo");
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const checked = useMemo(() => parseChecks(saved, seoulToday()), [saved]);

  const toggle = (id: string) => {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    // 날짜는 누를 때마다 다시 읽는다 — 자정을 넘겨 열어 둔 탭도 제 날짜로 저장된다
    saveChecks(seoulToday(), next);
  };

  /*
   * 빈 상태에는 안내 문구를 덧붙이지 않는다 — 이 화면이 무엇인지는 페이지
   * 머리글(todo.description)이 이미 말했고, 체크할 것이 없는 자리에서
   * 「체크는 이 브라우저에만 저장된다」는 설명은 읽을 이유가 없다.
   */
  if (todos.length === 0) {
    return (
      <EmptyState icon={CircleCheckBig} title={tr("empty")} description={tr("emptyHint")} />
    );
  }

  const done = todos.filter((t) => checked.includes(t.id)).length;
  const allDone = done === todos.length;
  const percent = Math.round((done / todos.length) * 100);

  return (
    <>
      {/* 진행률 — 체크를 누를 때 바로 반응하는 유일한 자리라 위에 둔다 */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold">
            {tr("progress", { done, total: todos.length })}
          </p>
          {allDone ? (
            <Badge variant="accent" size="md">
              <CircleCheckBig strokeWidth={2.5} />
              {tr("allDone")}
            </Badge>
          ) : (
            <span className="text-xs font-bold text-muted">{percent}%</span>
          )}
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-soft">
          <div
            className="champagne-gradient h-full rounded-full transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {todos.map((t) => {
          const { icon: DeadlineIcon, key, due } = deadline(t);
          const isDone = checked.includes(t.id);
          const labelId = `todo-label-${t.id}`;

          return (
            <li
              key={t.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-card transition-colors",
                isDone && "border-champagne-200 bg-champagne-50/50",
              )}
            >
              {/*
               * 진짜 체크박스다. 모양만 지우고(appearance-none) 체크 표시를 위에
               * 겹쳐 그린다 — 키보드 · 스크린리더 · 모바일 터치 영역을 브라우저가
               * 그대로 챙겨 준다. 이름은 옆의 제목(aria-labelledby)에서 가져온다.
               */}
              <span className="relative mt-0.5 grid shrink-0 place-items-center">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(t.id)}
                  aria-labelledby={labelId}
                  className={cn(
                    "size-5 cursor-pointer appearance-none rounded-md border-2 border-border-strong bg-surface transition-colors",
                    "checked:border-champagne-400 checked:bg-champagne-400",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
                  )}
                />
                {isDone && (
                  <Check
                    aria-hidden
                    className="pointer-events-none absolute size-3 text-champagne-ink"
                    strokeWidth={3.5}
                  />
                )}
              </span>

              <IconTile tone="surface" size="sm">
                <KindIcon iconType={t.iconType} emoji={t.emoji} kind={t.kind} size={32} />
              </IconTile>

              <div className="min-w-0 flex-1">
                {/*
                 * 홈 카드와 달리 제목 · 설명을 자르지 않는다 (truncate 없음) —
                 * 여기까지 들어온 사람은 할일을 하나씩 해치우려고 온 것이라,
                 * 「무엇을 하라는 건지」가 한 줄에 들어가는지보다 중요하다.
                 *
                 * 제목을 감싼 상자는 체크박스의 이름이 되는 자리(aria-labelledby)라
                 * **링크가 있든 없든 똑같이 서야 한다** — id 를 SmartLink 에 직접
                 * 달면 주소가 쓸 수 없는 값일 때 그 요소가 사라져 이름이 비게 된다.
                 */}
                <div id={labelId} className="text-sm font-bold text-pretty">
                  {t.url ? (
                    <SmartLink
                      href={t.url}
                      className={cn(
                        "text-sky-700 underline decoration-sky-300 underline-offset-4 hover:decoration-sky-600",
                        isDone && "text-muted decoration-border-strong line-through",
                      )}
                    >
                      {t.label}
                    </SmartLink>
                  ) : (
                    <span className={cn(isDone && "text-muted line-through")}>{t.label}</span>
                  )}
                </div>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted text-pretty">
                    {t.description}
                  </p>
                )}
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted">
                  <DeadlineIcon className="size-2.5 shrink-0" strokeWidth={2.5} />
                  <span>{tr(`deadline.${key}`, { due: due ?? "" })}</span>
                </p>
              </div>

              {/* 내부 가이드 페이지일 수도, 외부 문서일 수도 있다 — SmartLink 가 가른다 */}
              {t.guideUrl && (
                <SmartLink href={t.guideUrl} className="shrink-0">
                  <Badge variant="outline" size="md">
                    {tr("guide")}
                  </Badge>
                </SmartLink>
              )}
            </li>
          );
        })}
      </ul>

      {/* 체크가 어디에 남는지 — 기기를 바꾸면 비어 있는 이유가 여기 있다 */}
      <Notice>{tr("checkHint")}</Notice>
    </>
  );
}
