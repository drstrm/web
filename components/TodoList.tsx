"use client";

import { ChevronRight, CircleCheckBig } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import KindIcon from "@/components/KindIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, Button, EmptyState, IconTile, Notice } from "@/components/ui";
import type { TodoItem } from "@/lib/content";
import { HOME_TODO_LIMIT, deadline, visibleTodos } from "@/lib/todo";
import { useTodoClock } from "@/lib/use-todo-clock";

type Props = {
  /** 서버가 넓게 고른 후보 (lib/content.ts 의 getTodoList) */
  todos: TodoItem[];
  renderedAt: number;
};

/**
 * 보는 사람의 시간대 · 지금 시각으로 거른 할일. 홈 카드와 「전체보기 +N」이
 * 같은 결과를 봐야 개수가 어긋나지 않는다.
 */
function useVisibleTodos({ todos, renderedAt }: Props) {
  const { now, timeZone } = useTodoClock(renderedAt);
  const visible = useMemo(() => visibleTodos(todos, now, timeZone), [todos, now, timeZone]);
  return { visible, now, timeZone };
}

/**
 * 「전체보기」 링크. 홈은 앞 5개(HOME_TODO_LIMIT)까지만 보여주므로 넘치는 개수를
 * `+N` 으로 적는다 — 목록이 잘렸다는 사실이 링크를 누르기 전에 보여야
 * 「오늘 할 일이 이게 다」로 읽히지 않는다. 띄울 할일이 없으면 링크도 감춘다.
 */
export function TodoViewAllLink(props: Props) {
  const tr = useTranslations("todo");
  const { visible } = useVisibleTodos(props);
  if (visible.length === 0) return null;
  return (
    <Button asChild variant="ghost" size="sm">
      <SmartLink href="/todo">
        {tr("viewAll")}
        {visible.length > HOME_TODO_LIMIT && (
          <span className="font-extrabold text-sky-700">+{visible.length - HOME_TODO_LIMIT}</span>
        )}
        <ChevronRight strokeWidth={2.5} />
      </SmartLink>
    </Button>
  );
}

/**
 * 홈 To Do List (요약)
 * ------------------------------------------------------------------
 * 공용 일정 DB(노션)에서 `노출 위치` 에 todo 가 있는 후보가 내려오고
 * (lib/content.ts getTodoList), 보는 사람의 현지 「오늘」로 여기서 거른다.
 * 정렬은 `순서` 열 → 마감 임박 순.
 *
 * 홈은 **앞 몇 개만** 보여준다 (lib/todo.ts 의 HOME_TODO_LIMIT). 거른 **뒤에**
 * 잘라야 하므로 자르는 것도 여기서 한다. 체크박스가 달린 전체 목록은 /todo 에 있다
 * (components/TodoChecklist.tsx).
 */
export default function TodoList(props: Props) {
  // 목록 콜백의 `t`(TodoItem)와 겹치지 않게 번역기는 tr 로 둔다
  const tr = useTranslations("todo");
  const { visible, now, timeZone } = useVisibleTodos(props);
  const todos = visible.slice(0, HOME_TODO_LIMIT);
  if (todos.length === 0) {
    return (
      <>
        <EmptyState
          icon={CircleCheckBig}
          title={tr("empty")}
          description={tr("emptyHint")}
        />
        <Notice>{tr("footnote")}</Notice>
      </>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {todos.map((t) => {
          const { icon: DeadlineIcon, key, due } = deadline(t, timeZone, now);

          return (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl bg-sky-50/70 px-3 py-2.5 transition-colors hover:bg-sky-50"
            >
              <IconTile tone="surface" size="sm">
                <KindIcon iconType={t.iconType} emoji={t.emoji} kind={t.kind} size={32} />
              </IconTile>

              <div className="min-w-0 flex-1">
                {t.url ? (
                  <SmartLink
                    href={t.url}
                    className="block truncate text-sm font-bold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:decoration-sky-600"
                  >
                    {t.label}
                  </SmartLink>
                ) : (
                  <p className="truncate text-sm font-bold">{t.label}</p>
                )}
                {t.description && (
                  <p className="truncate text-[11px] text-muted">{t.description}</p>
                )}
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-muted">
                  <DeadlineIcon className="size-2.5 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{tr(`deadline.${key}`, { due: due ?? "" })}</span>
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
      <Notice>{tr("footnote")}</Notice>
    </>
  );
}
