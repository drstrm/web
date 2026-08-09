import { POSSIBILITY_LABEL, type Possibility } from "@/lib/radio";

/**
 * 신청 가능성 뱃지.
 * 편성표와 원클릭 버튼이 같은 색을 써야 "여기 넣으면 되겠다"가 한눈에 들어온다.
 * value 가 null 이면 편성 정보가 없는 시간대다(심야 공백 · 편성표 미등록 채널).
 */
export default function RadioPossibility({
  value,
}: {
  value: Possibility | null;
}) {
  if (value === null) {
    return (
      <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-bold text-muted">
        편성 정보 없음
      </span>
    );
  }

  const tone =
    value === 2
      ? "accent-gradient text-[#5a4a1f]"
      : value === 1
        ? "bg-sky-50 text-sky-600"
        : "bg-background text-muted";

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
      {POSSIBILITY_LABEL[value]}
    </span>
  );
}
