import { CalendarClock, CircleCheckBig, Infinity as InfinityIcon, Repeat } from "lucide-react";
import KindIcon from "@/components/KindIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, EmptyState, IconTile, Notice } from "@/components/ui";
import type { TodoItem } from "@/lib/content";
import { formatKstDate, formatKstDateTime } from "@/lib/datetime";

/**
 * 홈 To Do List
 * ------------------------------------------------------------------
 * 공용 일정 DB(노션)에서 `노출 위치` 에 todo 가 있고 지금 기간 안에 있는 일정만
 * 내려온다(lib/content.ts getTodoList). 정렬은 `순서` 열 → 마감 임박 순.
 */

/**
 * 마감 표시.
 * · 매일 반복 할일은 마감이 의미가 없다 — 오늘 하면 내일 또 해야 한다.
 * · 하루 종일 일정은 시각을 떼고, 기간을 안 적었으면 상시 할일.
 */
function deadline(t: TodoItem): { icon: typeof Repeat; text: string } {
  if (t.daily) return { icon: Repeat, text: "매일" };
  if (!t.endsAt) return { icon: InfinityIcon, text: "상시" };
  return {
    icon: CalendarClock,
    text: `마감 ${t.allDay ? formatKstDate(t.endsAt) : formatKstDateTime(t.endsAt)}`,
  };
}

const FOOTNOTE = "컴백 기간 동안 매일 해야 하는 투표 · 스밍 리스트입니다.";

export default function TodoList({ todos }: { todos: TodoItem[] }) {
  if (todos.length === 0) {
    return (
      <>
        <EmptyState
          icon={CircleCheckBig}
          title="지금 진행중인 할일이 없습니다"
          description="투표 · 스밍 일정이 시작되면 여기에 표시됩니다."
        />
        <Notice>{FOOTNOTE}</Notice>
      </>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {todos.map((t) => {
          const { icon: DeadlineIcon, text } = deadline(t);

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
                  <span className="truncate">{text}</span>
                </p>
              </div>

              {/* 내부 가이드 페이지일 수도, 외부 문서일 수도 있다 — SmartLink 가 가른다 */}
              {t.guideUrl && (
                <SmartLink href={t.guideUrl} className="shrink-0">
                  <Badge variant="outline" size="md">
                    가이드
                  </Badge>
                </SmartLink>
              )}
            </li>
          );
        })}
      </ul>
      <Notice>{FOOTNOTE}</Notice>
    </>
  );
}
