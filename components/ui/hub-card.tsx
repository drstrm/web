import { ArrowRight } from "lucide-react";
import { createElement } from "react";
import SmartLink from "@/components/SmartLink";
import { IconTile } from "@/components/ui/icon-tile";
import { iconForRoute } from "@/lib/nav-icons";

/**
 * 허브 카드 — /guide · /oneclick · /community 첫 화면의 큰 링크 카드.
 * 세 페이지가 같은 모양을 쓰도록 한 곳에 모았다. 아이콘은 href 로 찾으므로
 * 헤더 메뉴에 보이던 그림이 카드에도 그대로 나온다.
 */
export function HubCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <SmartLink
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-champagne-300 hover:shadow-lift active:scale-[0.99]"
    >
      <IconTile
        size="lg"
        className="transition-colors group-hover:bg-champagne-400 group-hover:text-champagne-ink"
      >
        {/* 경로 → 아이콘 맵에서 꺼낸 값이라 참조가 고정이다 (KindIcon 과 같은 이유) */}
        {createElement(iconForRoute(href), { strokeWidth: 2.2 })}
      </IconTile>

      <h2 className="mt-3.5 flex items-center gap-1 font-extrabold transition-colors group-hover:text-sky-700">
        {title}
        <ArrowRight
          aria-hidden
          className="size-3.5 shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">{description}</p>
    </SmartLink>
  );
}
