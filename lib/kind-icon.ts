/*
 * 노션 일정 DB 의 `종류` 별 기본 아이콘.
 * ------------------------------------------------------------------
 * 아이콘 우선순위는 components/KindIcon.tsx 가 정한다:
 *   public/icons 플랫폼 아이콘 > 노션 `emoji` 열 > 여기 lucide 아이콘
 *
 * 운영진이 노션에 이모지를 직접 적었으면 그 뜻이 있으므로 존중하고,
 * 아무것도 없을 때 화면이 비지 않도록 종류별 기본값을 둔다.
 */

import {
  CalendarDays,
  Cake,
  Disc3,
  Headphones,
  Heart,
  Pin,
  Tv,
  TrendingUp,
  Vote,
  type LucideIcon,
} from "lucide-react";

export const KIND_ICON: Record<string, LucideIcon> = {
  debut: Heart,
  birthday: Cake,
  comeback: Disc3,
  vote: Vote,
  chart: TrendingUp,
  broadcast: Tv,
  streaming: Headphones,
  schedule: CalendarDays,
  etc: Pin,
};

export const iconOf = (kind: string): LucideIcon => KIND_ICON[kind] ?? Pin;
