import { ChevronRight, HandHeart } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { Badge, EmptyState, IconTile } from "@/components/ui";
import type { GroupOrder } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * 팬덤 공구 목록
 * ------------------------------------------------------------------
 * 목록은 노션 DB 에서 온다 (docs/notion-album-db.md). **공구주 컨택 · 동의가
 * 끝난 공구만** 올라오므로, 평소에는 비어 있는 것이 정상이다 — 그래서 빈 상태
 * 문구가 「없다」가 아니라 「추가될 예정」이다.
 *
 * 링크가 없는 행도 남긴다. 「누가 공구를 연다」까지는 정해졌고 신청 폼만
 * 기다리는 상태가 실제로 있어서, 그때 자리를 미리 보여주는 편이 낫다.
 */
export default function GroupOrders({ orders }: { orders: GroupOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={HandHeart}
        tone="accent"
        title="팬덤 공구 준비 중입니다"
        description="공구주분 컨택 후 추가될 예정입니다."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <GroupOrderRow key={order.key} order={order} />
      ))}
    </div>
  );
}

function GroupOrderRow({ order }: { order: GroupOrder }) {
  const body = (
    <>
      <IconTile tone={order.href ? "sky" : "surface"} size="md">
        <HandHeart strokeWidth={2.2} />
      </IconTile>

      <div className="min-w-0 flex-1">
        <h3 className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate font-bold transition-colors group-hover:text-sky-700">
            {order.host}
          </span>
          {/* 공구를 받는 곳(네이버 폼 · 구글 폼 …). 공구주 이름 옆이 가장 자연스럽다 */}
          {order.site && (
            <Badge variant="outline" size="sm">
              {order.site}
            </Badge>
          )}
        </h3>
        {order.note && <p className="mt-0.5 truncate text-xs text-muted">{order.note}</p>}
      </div>

      <span className="ml-1 flex shrink-0 items-center gap-0.5 self-center">
        <Badge variant={order.href ? "accent" : "muted"} size="lg">
          {order.href ? "신청" : "준비 중"}
        </Badge>
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 text-sky-400 transition-transform group-hover:translate-x-0.5",
            !order.href && "invisible",
          )}
          strokeWidth={2.5}
        />
      </span>
    </>
  );

  const shell =
    "flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card";

  if (!order.href) {
    return <article className={cn(shell, "opacity-65")}>{body}</article>;
  }

  return (
    <SmartLink
      href={order.href}
      className={cn(
        shell,
        "group transition-all hover:-translate-y-0.5 hover:border-champagne-300 hover:shadow-lift",
      )}
    >
      {body}
    </SmartLink>
  );
}
