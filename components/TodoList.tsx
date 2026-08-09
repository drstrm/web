import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import type { TodoItem } from "@/lib/content";
import { formatKstDate, formatKstDateTime } from "@/lib/datetime";
import { emojiOf } from "@/lib/kind-emoji";

/**
 * 홈 To Do List
 * ------------------------------------------------------------------
 * 공용 `schedules` 테이블에서 surfaces 에 'todo' 가 포함되고
 * 지금 기간 안에 있는 일정만 내려온다(lib/content.ts getTodoList).
 * 정렬은 sort_order → 마감 임박 순.
 */

/** 마감 표시. 하루 종일 일정은 시각을 떼고, 종료일이 없으면 상시 할일 */
function deadline(t: TodoItem): string {
  if (!t.endsAt) return "상시";
  return `마감 ${t.allDay ? formatKstDate(t.endsAt) : formatKstDateTime(t.endsAt)}`;
}

export default function TodoList({ todos }: { todos: TodoItem[] }) {
  if (todos.length === 0) {
    return (
      <>
        <div className="rounded-xl bg-sky-50/60 py-6 text-center">
          <span className="text-2xl">☑️</span>
          <p className="mt-2 text-sm font-bold">지금 진행중인 할일이 없습니다</p>
          <p className="mt-1 text-xs text-muted">
            투표 · 스밍 일정이 시작되면 여기에 표시됩니다.
          </p>
        </div>
        <p className="mt-4 text-[11px] text-muted">
          * 컴백 기간 동안 매일 해야 하는 투표 · 스밍 리스트입니다.
        </p>
      </>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {todos.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-xl bg-sky-50/60 px-3 py-2.5"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface text-base">
              <PlatformIcon
                iconType={t.iconType}
                size={32}
                fallback={emojiOf(t.kind, t.emoji)}
              />
            </span>

            <div className="min-w-0 flex-1">
              {t.url ? (
                <SmartLink
                  href={t.url}
                  className="block truncate text-sm font-semibold text-sky-600 underline underline-offset-2"
                >
                  {t.label}
                </SmartLink>
              ) : (
                <p className="truncate text-sm font-semibold">{t.label}</p>
              )}
              {t.description && (
                <p className="truncate text-[11px] text-muted">{t.description}</p>
              )}
              <p className="text-[11px] text-muted">{deadline(t)}</p>
            </div>

            {/* 내부 가이드 페이지일 수도, 외부 문서일 수도 있다 — SmartLink 가 가른다 */}
            {t.guideUrl && (
              <SmartLink
                href={t.guideUrl}
                className="shrink-0 rounded-full border bg-surface px-2.5 py-1 text-[11px] font-bold text-muted"
              >
                가이드
              </SmartLink>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-muted">
        * 컴백 기간 동안 매일 해야 하는 투표 · 스밍 리스트입니다.
      </p>
    </>
  );
}
