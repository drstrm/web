import { CalendarRange, ChevronRight, type LucideIcon } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { Badge, ComingSoon, IconTile } from "@/components/ui";
import type { FormLink, FormPageInfo } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";
import { cn } from "@/lib/utils";

/**
 * 폼 · 헬퍼 목록 (/forms · /helper)
 * ------------------------------------------------------------------
 * 두 페이지가 같은 화면을 쓰고, 항목은 노션 한 DB 에서 `구분` 열로 갈라 온다
 * (lib/notion.ts 의 getFormLinks → lib/content.ts).
 *
 * 신청 가능한 폼만 링크가 된다. 마감 · 준비 중인 폼도 목록에는 남겨 두는데,
 * 「이 폼은 이미 끝났다」를 보여주는 편이 「사라져서 못 찾겠다」보다 낫기 때문이다
 * (가이드 목록의 오픈 예정 항목과 같은 방침 — components/GuideList.tsx).
 */
export default function FormLinks({
  links,
  info,
}: {
  links: FormLink[];
  info: FormPageInfo;
}) {
  // 노션 조회에 실패했거나(로그: [form-links]) 아직 등록된 폼이 없는 경우
  if (links.length === 0) {
    return (
      <ComingSoon
        label={info.empty}
        description="새 폼이 열리면 이곳에 바로 올라옵니다."
        icon={iconForRoute(info.href)}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {links.map((link) => (
        <FormRow key={link.key} link={link} fallbackIcon={iconForRoute(info.href)} />
      ))}
    </div>
  );
}

const BADGE: Record<
  FormLink["status"],
  { label: string; variant: "muted" | "accent" } | null
> = {
  open: null,
  closed: { label: "마감", variant: "muted" },
  upcoming: { label: "준비 중", variant: "accent" },
};

function FormRow({ link, fallbackIcon }: { link: FormLink; fallbackIcon: LucideIcon }) {
  const badge = BADGE[link.status];
  const FallbackIcon = fallbackIcon;

  const body = (
    <>
      <IconTile tone={link.status === "open" ? "sky" : "surface"} size="md">
        {/* 운영진이 노션에 이모지를 적었으면 그대로 쓰고, 없으면 페이지 아이콘 */}
        {link.emoji ? (
          <span aria-hidden className="text-base leading-none">
            {link.emoji}
          </span>
        ) : (
          <FallbackIcon strokeWidth={2.2} />
        )}
      </IconTile>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate font-bold transition-colors group-hover:text-sky-700">
            {link.title}
          </h3>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>

        {/* 요약 · 기간이 없는 항목도 카드 높이가 같도록 자리를 비워 둔다 */}
        <div className="mt-1.5 grid h-9 content-start gap-1 overflow-hidden">
          {link.summary ? (
            <p className="truncate text-xs text-muted">{link.summary}</p>
          ) : (
            <span className="h-4" aria-hidden />
          )}
          {link.period ? (
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted">
              <CalendarRange className="size-3 shrink-0 text-sky-500" strokeWidth={2.3} />
              <span className="min-w-0 truncate">{link.period}</span>
            </p>
          ) : (
            <span className="h-4" aria-hidden />
          )}
        </div>
      </div>

      {link.href && (
        <span className="ml-1 flex shrink-0 items-center gap-0.5 self-center">
          <Badge variant="accent" size="lg">
            신청
          </Badge>
          <ChevronRight
            aria-hidden
            className="size-3.5 text-sky-400 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.5}
          />
        </span>
      )}
    </>
  );

  const shell =
    "flex h-24 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-card";

  if (!link.href) {
    return <article className={cn(shell, "opacity-65")}>{body}</article>;
  }

  return (
    <SmartLink
      href={link.href}
      className={cn(
        shell,
        "group transition-all hover:-translate-y-0.5 hover:border-champagne-300 hover:shadow-lift",
      )}
    >
      {body}
    </SmartLink>
  );
}
