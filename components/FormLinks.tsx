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
    <div className="grid gap-3 sm:grid-cols-2">
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
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-xl">
        {link.emoji || fallbackEmoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold group-hover:text-sky-600">{link.title}</h3>
          {badge && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {link.summary && <p className="mt-1.5 text-xs text-muted">{link.summary}</p>}
        {link.period && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
            <span aria-hidden="true">🗓</span>
            {link.period}
          </p>
        )}
        {link.href && <p className="mt-1.5 text-xs font-bold text-sky-500">신청하러 가기</p>}
      </div>

      {link.href && (
        <span
          aria-hidden
          className="self-center text-lg text-sky-400 transition-transform group-hover:translate-x-0.5"
        >
          ›
        </span>
      )}
    </>
  );

  const shell = "flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-sm";

  if (!link.href) {
    return <article className={`${shell} opacity-70`}>{body}</article>;
  }

  return (
    <SmartLink
      href={link.href}
      className={`group ${shell} transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md`}
    >
      {body}
    </SmartLink>
  );
}
