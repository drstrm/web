import { CalendarRange, ChevronRight, type LucideIcon } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { Badge, ComingSoon, IconTile } from "@/components/ui";
import type { FormLink, FormPageInfo } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";
import { cn } from "@/lib/utils";

/**
 * 폼 · 헬퍼 목록 (/community/forms · /community/helper)
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

  /*
   * 요약 · 기간 줄은 「이 목록에 한 항목이라도 쓰는가」로만 자리를 잡는다.
   * 그래야 줄 위치는 행끼리 맞으면서, 아무도 안 쓰는 줄 때문에 카드가
   * 쓸데없이 높아지지 않는다 (예: 헬퍼 목록엔 기간이 없다).
   */
  const rows = {
    summary: links.some((link) => link.summary),
    period: links.some((link) => link.period),
  };

  return (
    <div className="grid auto-rows-fr gap-3">
      {links.map((link) => (
        <FormRow
          key={link.key}
          link={link}
          rows={rows}
          fallbackIcon={iconForRoute(info.href)}
        />
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

function FormRow({
  link,
  rows,
  fallbackIcon,
}: {
  link: FormLink;
  /** 목록 전체에서 요약 · 기간 줄을 쓰는지 — 카드 높이가 여기서 정해진다 */
  rows: { summary: boolean; period: boolean };
  fallbackIcon: LucideIcon;
}) {
  const badge = BADGE[link.status];
  const FallbackIcon = fallbackIcon;

  const body = (
    <>
      {/*
       * 아이콘 · 제목 · 설명을 한 묶음으로 카드 가운데에 놓는다. 묶음 안에서는
       * 아이콘 타일과 제목 줄을 같은 높이(h-10)로 맞춰 윗변을 붙였으니
       * (items-start) 둘의 가운데가 한 선에 온다. 제목을 카드 정중앙에 고정하면
       * 설명이 아래로만 흘러 카드 위쪽에 빈 자리가 크게 남는다.
       */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
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
          <div className="flex items-center">
            <h3 className="min-w-0 flex-1 truncate font-bold transition-colors group-hover:text-sky-700">
              {link.title}
            </h3>
          </div>

          {/* 같은 목록의 다른 행에 있는 줄은 이 행이 비어도 자리를 지킨다.
              둘 다 없는 행은 아예 빼서 아이콘 · 제목이 카드 가운데에 오게 둔다 */}
          {(link.summary || link.period) && (
            <div className="grid content-start gap-1 overflow-hidden">
              {rows.summary &&
                (link.summary ? (
                  <p className="truncate text-xs text-muted">{link.summary}</p>
                ) : (
                  <span className="h-4" aria-hidden />
                ))}
              {rows.period &&
                (link.period ? (
                  <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted">
                    <CalendarRange className="size-3 shrink-0 text-sky-500" strokeWidth={2.3} />
                    <span className="min-w-0 truncate">{link.period}</span>
                  </p>
                ) : (
                  <span className="h-4" aria-hidden />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 뱃지 자리 — 「신청」이든 「준비 중 · 마감」이든 같은 자리에 온다.
          화살표는 링크가 있을 때만 보이되 자리는 늘 잡아 둬 뱃지 위치가 흔들리지 않는다 */}
      <span className="ml-1 flex shrink-0 items-center gap-0.5 self-center">
        {link.href ? (
          <Badge variant="accent" size="lg">
            신청
          </Badge>
        ) : (
          badge && (
            <Badge variant={badge.variant} size="lg">
              {badge.label}
            </Badge>
          )
        )}
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 text-sky-400 transition-transform group-hover:translate-x-0.5",
            !link.href && "invisible",
          )}
          strokeWidth={2.5}
        />
      </span>
    </>
  );

  /* 높이는 고정하지 않는다 — 제목 줄(h-10) + 목록이 쓰는 설명 줄 만큼만 */
  const shell =
    "flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-card";

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
