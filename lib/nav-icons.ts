/*
 * 경로별 아이콘.
 * ------------------------------------------------------------------
 * 헤더 · 모바일 메뉴 · 허브 카드가 같은 경로에는 같은 아이콘을 쓰도록
 * 한곳에 모았다. 새 페이지를 추가하면 여기에 한 줄만 더하면 된다.
 *
 * 이모지 대신 lucide 아이콘을 쓰는 이유: 이모지는 OS 마다 그림도 크기도 달라
 * 안드로이드와 iOS 에서 같은 화면이 다르게 보인다. SVG 는 어디서나 같다.
 */

import {
  BookOpen,
  ClipboardList,
  Download,
  HandHeart,
  Headphones,
  Home,
  IdCard,
  ListMusic,
  Megaphone,
  MessagesSquare,
  CircleQuestionMark,
  Radio,
  Sparkles,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const ROUTE_ICON: Record<string, LucideIcon> = {
  "/": Home,

  "/guide": BookOpen,
  "/guide/streaming": Headphones,
  "/guide/id-generate": IdCard,
  "/guide/voting": Vote,
  "/guide/download": Download,
  "/guide/etc": Sparkles,

  "/oneclick": Zap,
  "/oneclick/streaming": ListMusic,
  "/oneclick/voting": Vote,
  "/oneclick/radio": Radio,

  "/community": MessagesSquare,
  "/community/notice": Megaphone,
  "/community/faq": CircleQuestionMark,

  "/forms": ClipboardList,
  "/helper": HandHeart,
};

/** 등록되지 않은 경로는 Sparkles 로 둔다 (화면이 비지 않게) */
export const iconForRoute = (href: string): LucideIcon => ROUTE_ICON[href] ?? Sparkles;
