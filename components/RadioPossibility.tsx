"use client";

import { CircleDashed, Sparkles, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import type { Possibility } from "@/lib/radio";

/**
 * 신청 가능성 뱃지.
 * 편성표와 원클릭 버튼이 같은 색을 써야 "여기 넣으면 되겠다"가 한눈에 들어온다.
 * 가장 가능성이 높은 등급에만 포인트 컬러(샴페인)를 써서 시선을 그쪽으로 몬다.
 * value 가 null 이면 편성 정보가 없는 시간대다(심야 공백 · 편성표 미등록 채널).
 *
 * ⚠ **클라이언트 컴포넌트다.** 이 뱃지를 쓰는 곳이 `"use client"` 인
 *   components/RadioOneclick.tsx 하나뿐이라, 서버 컴포넌트로 두면 클라이언트
 *   번들로 끌려 들어가면서 깨진다 — `"use client"` 모듈이 import 한 모듈은
 *   지시문이 없어도 클라이언트가 된다. 그 상태에서 async 이거나
 *   next-intl/server 의 getTranslations 를 쓰면 런타임에 터진다:
 *     「is an async Client Component」 ·
 *     「getTranslations is not supported in Client Components」
 *   서버에서도 이 뱃지를 쓰게 되면 그때 분리할 것.
 */
export default function RadioPossibility({ value }: { value: Possibility | null }) {
  const t = useTranslations("radio");

  if (value === null) {
    return (
      <Badge variant="muted">
        <CircleDashed strokeWidth={2.4} />
        {t("noScheduleInfo")}
      </Badge>
    );
  }

  if (value === 2) {
    return (
      <Badge variant="accent">
        <Sparkles strokeWidth={2.6} />
        {t("possibility.2")}
      </Badge>
    );
  }

  if (value === 1) {
    return (
      <Badge variant="sky">
        <ThumbsUp strokeWidth={2.4} />
        {t("possibility.1")}
      </Badge>
    );
  }

  return <Badge variant="muted">{t("possibility.0")}</Badge>;
}
