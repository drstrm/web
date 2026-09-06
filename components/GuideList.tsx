import { ChevronRight, Images } from "lucide-react";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import { Badge, ComingSoon, IconTile } from "@/components/ui";
import type { GuideItem, GuideSection } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * 가이드 목록 (플랫폼별)
 * ------------------------------------------------------------------
 * 목록에서는 이름만 고르게 하고, 이미지는 상세 페이지(`<basePath>/<slug>`)에서
 * 화면 폭에 꽉 차게 보여준다. 목록 화면에서 썸네일 수십 장을 내려받지 않으므로
 * 첫 진입이 가볍고, 가이드 하나하나가 공유 가능한 주소를 갖는다.
 */
export default function GuideList({
  sections,
  basePath,
}: {
  sections: GuideSection[];
  basePath: string;
}) {
  // 노션 조회에 실패했거나 아직 아무것도 공개되지 않은 경우
  if (sections.length === 0) {
    return <ComingSoon label="가이드를 준비하고 있어요" />;
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id}>
          <h2 className="mb-4 flex items-center gap-2">
            <span aria-hidden className="brand-gradient-y h-[18px] w-1 shrink-0 rounded-full" />
            <span className="text-lg font-extrabold tracking-tight">{section.title}</span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <GuideRow key={item.slug} item={item} basePath={basePath} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function GuideRow({ item, basePath }: { item: GuideItem; basePath: string }) {
  // 오픈 예정이거나 이미지가 없는 항목은 열어봐야 볼 게 없으므로 링크로 만들지 않는다.
  const openable = item.status === "ready" && (item.images?.length ?? 0) > 0;

  const body = (
    <>
      {/* 플랫폼 아이콘 (public/icons). 한 가이드가 앱 여러 개를 다루면 나란히 표시 */}
      {item.iconTypes && item.iconTypes.length > 0 && (
        <div className="flex shrink-0 gap-1">
          {item.iconTypes.map((key) => (
            <IconTile key={key} tone="sky" size="md">
              <PlatformIcon iconType={key} size={40} />
            </IconTile>
          ))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold transition-colors group-hover:text-sky-700">{item.title}</h3>
          {item.status === "coming-soon" && (
            <Badge variant="accent">오픈 예정</Badge>
          )}
        </div>
        {item.summary && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.summary}</p>
        )}
        {openable && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-600">
            <Images className="size-3 shrink-0" strokeWidth={2.4} />
            가이드 보기
            {item.images!.length > 1 && ` · ${item.images!.length}장`}
          </p>
        )}
      </div>

      {openable && (
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 self-center text-sky-400 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      )}
    </>
  );

  const shell =
    "flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card";

  if (!openable) {
    return <article className={cn(shell, "opacity-65")}>{body}</article>;
  }

  return (
    <SmartLink
      href={`${basePath}/${item.slug}`}
      className={cn(
        shell,
        "group transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lift",
      )}
    >
      {body}
    </SmartLink>
  );
}
