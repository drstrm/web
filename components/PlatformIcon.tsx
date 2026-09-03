import Image from "next/image";
import { PLATFORM_ICONS } from "@/lib/platform-icons";

/**
 * 플랫폼 아이콘 (멜론 · 팬캐스트 · 뮤빗 …)
 * ------------------------------------------------------------------
 * iconType 은 노션 일정 DB 의 `플랫폼` 값이자 public/icons/<key>.png 의 파일명이다.
 * 정적 파일이라 CDN 캐시 · next/image 최적화를 그대로 받는다.
 *
 * 이미지는 감싸는 요소(span 등)를 꽉 채운다. 부모에 크기 · 모서리 · overflow-hidden 을
 * 주면 그 모양대로 잘린다. size 는 CSS 상 표시 크기이므로 부모 박스의 px 크기와 맞춰 넘긴다.
 *
 * next/image 에는 size 의 2배를 요청한다. 고정 크기 이미지의 srcset 은 1x·2x 만 나오는데,
 * 그대로 두면 3x 기기(아이폰 등)에서 2x 를 골라 뿌옇게 보인다. 2배를 기준으로 두면
 * 1x 기기는 2배, 2x 이상 기기는 4배 소스를 받아 원본(480~512px) 해상도를 살린다.
 *
 * 매칭되는 아이콘이 없으면 fallback(이모지 등)을 그리거나 아무것도 그리지 않는다.
 */
export default function PlatformIcon({
  iconType,
  size = 24,
  fallback = null,
  className = "",
}: {
  iconType?: string | null;
  size?: number;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const name = iconType ? PLATFORM_ICONS[iconType] : undefined;
  if (!iconType || !name) return <>{fallback}</>;

  return (
    <Image
      src={`/icons/${iconType}.png`}
      alt={name}
      width={size * 2}
      height={size * 2}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
