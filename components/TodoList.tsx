import { CircleCheckBig } from "lucide-react";
import { getTranslations } from "next-intl/server";
import KindIcon from "@/components/KindIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, EmptyState, IconTile, Notice } from "@/components/ui";
import type { TodoItem } from "@/lib/content";
import { deadline } from "@/lib/todo";

/**
 * 홈 To Do List (요약)
 * ------------------------------------------------------------------
 * 공용 일정 DB(노션)에서 `노출 위치` 에 todo 가 있고 지금 기간 안에 있는 일정만
 * 내려온다(lib/content.ts getTodoList). 정렬은 `순서` 열 → 마감 임박 순.
 *
 * 홈은 **앞 몇 개만** 보여준다 (lib/todo.ts 의 HOME_TODO_LIMIT — 자르는 건
 * app/[locale]/page.tsx). 체크박스가 달린 전체 목록은 /todo 에 있다
 * (components/TodoChecklist.tsx).
 */
export default async function TodoList({ todos }: { todos: TodoItem[] }) {
  // 목록 콜백의 `t`(TodoItem)와 겹치지 않게 번역기는 tr 로 둔다
  const tr = await getTranslations("todo");
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
          const { icon: DeadlineIcon, key, due } = deadline(t);

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
