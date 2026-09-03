import SmartLink from "@/components/SmartLink";
import { ComingSoon } from "@/components/ui";
import type { FormLink, FormPageInfo } from "@/lib/content";

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
      <ComingSoon label={info.empty} description="새 폼이 열리면 이곳에 바로 올라옵니다." />
    );
  }

  return (
    <div className="grid gap-3">
      {links.map((link) => (
        <FormRow key={link.key} link={link} fallbackEmoji={info.emoji} />
      ))}
    </div>
  );
}

const BADGE: Record<FormLink["status"], { label: string; className: string } | null> = {
  open: null,
  closed: { label: "마감", className: "bg-sky-100 text-muted" },
  upcoming: { label: "준비 중", className: "accent-gradient text-[#5a4a1f]" },
};

function FormRow({ link, fallbackEmoji }: { link: FormLink; fallbackEmoji: string }) {
  const badge = BADGE[link.status];

  const body = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-50 text-lg">
        {link.emoji || fallbackEmoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate font-bold group-hover:text-sky-600">
            {link.title}
          </h3>
          {badge && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        <div className="mt-1.5 grid h-9 content-start gap-1 overflow-hidden">
          {link.summary ? (
            <p className="truncate text-xs text-muted">{link.summary}</p>
          ) : (
            <span className="h-4" aria-hidden />
          )}
          {link.period ? (
            <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
              <span aria-hidden="true">🗓</span>
              <span className="min-w-0 truncate">{link.period}</span>
            </p>
          ) : (
            <span className="h-4" aria-hidden />
          )}
        </div>
      </div>

      {link.href && (
        <span className="ml-2 shrink-0 self-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600">
          신청
        </span>
      )}
    </>
  );

  const shell =
    "flex h-24 items-center gap-3 rounded-xl border bg-surface px-4 py-3 shadow-sm";

  if (!link.href) {
    return <article className={`${shell} opacity-70`}>{body}</article>;
  }

  return (
    <SmartLink
      href={link.href}
      className={`group ${shell} transition-colors hover:border-sky-300 hover:bg-sky-50/60`}
    >
      {body}
    </SmartLink>
  );
}
