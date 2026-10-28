/*
 * 언어를 아는 내비게이션
 * ------------------------------------------------------------------
 * i18n/routing.ts 의 규칙을 적용한 Link · usePathname · useRouter 묶음이다.
 * 여기서 나온 <Link> 는 `/guide/streaming` 을 지금 언어에 맞게 알아서 바꾼다
 * (한국어면 그대로, 영어면 `/en/guide/streaming`).
 *
 * ⚠ 화면에서 이 Link 를 직접 쓰지 말고 <SmartLink> 를 쓴다
 *   (components/SmartLink.tsx). SmartLink 가 내부 링크일 때만 이쪽으로 넘기고,
 *   외부 · 기기 앱 링크는 <a> 로 처리한다. 접두어가 붙으면 안 되는
 *   `https://…` · `mailto:` 에 언어가 끼어드는 사고를 막는 구조다.
 */

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
