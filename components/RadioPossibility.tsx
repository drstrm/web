import { CircleDashed, Sparkles, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui";
import { POSSIBILITY_LABEL, type Possibility } from "@/lib/radio";

/**
 * 신청 가능성 뱃지.
 * 편성표와 원클릭 버튼이 같은 색을 써야 "여기 넣으면 되겠다"가 한눈에 들어온다.
 * 가장 가능성이 높은 등급에만 포인트 컬러(샴페인)를 써서 시선을 그쪽으로 몬다.
 * value 가 null 이면 편성 정보가 없는 시간대다(심야 공백 · 편성표 미등록 채널).
 */
export default function RadioPossibility({ value }: { value: Possibility | null }) {
  if (value === null) {
    return (
      <Badge variant="muted">
        <CircleDashed strokeWidth={2.4} />
        편성 정보 없음
      </Badge>
    );
  }

  if (value === 2) {
    return (
      <Badge variant="accent">
        <Sparkles strokeWidth={2.6} />
        {POSSIBILITY_LABEL[value]}
      </Badge>
    );
  }

  if (value === 1) {
    return (
      <Badge variant="sky">
        <ThumbsUp strokeWidth={2.4} />
        {POSSIBILITY_LABEL[value]}
      </Badge>
    );
  }

  return <Badge variant="muted">{POSSIBILITY_LABEL[value]}</Badge>;
}
