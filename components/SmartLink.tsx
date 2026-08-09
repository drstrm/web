import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { resolveHref } from "@/lib/url";

/**
 * 사이트의 모든 링크가 지나는 곳.
 * ------------------------------------------------------------------
 * 주소를 lib/url.ts 로 보정한 뒤, 내부 · 외부 · 기기 앱 중 무엇인지에 따라
 * 알맞은 요소로 렌더한다. 화면마다 `startsWith("http")` 로 판단하고 `target`,
 * `rel` 을 직접 붙이던 것을 여기 한 곳으로 모은 것이다 — 새로 만드는 화면이
 * `rel="noopener"` 를 빠뜨리거나 새 탭 규칙을 다르게 가져갈 여지를 없앤다.
 *
 * 내부 경로는 next/link 로 나가므로 프리페치 · 클라이언트 라우팅이 그대로 유지된다.
 */
export default function SmartLink({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const resolved = resolveHref(href);

  // 보정해도 쓸 수 없는 주소(`javascript:` 등)는 링크로 만들지 않는다.
  // 화면이 무너지지 않도록 자리와 스타일은 그대로 두고 클릭만 막는다.
  if (!resolved) return <span className={className}>{children}</span>;

  if (resolved.kind === "internal") {
    return (
      <Link href={resolved.href} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={resolved.href}
      className={className}
      /*
       * 사이트 밖으로 나가는 링크만 새 탭이다.
       * mailto: · sms: · tel: 을 새 탭으로 열면 기기 앱이 뜬 뒤 빈 탭이 남는다.
       */
      {...(resolved.kind === "external"
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      {...rest}
    >
      {children}
    </a>
  );
}
