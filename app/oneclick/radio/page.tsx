import type { Metadata } from "next";
import RadioOneclick from "@/components/RadioOneclick";
import RadioSchedule from "@/components/RadioSchedule";
import { PageHeader, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "라디오 원클릭" };

export default function OneclickRadioPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="ONECLICK"
        title="라디오"
        description="지금 방송 중인 프로그램에 맞춰 사연을 만들어 드려요. 버튼 하나로 문자 신청까지."
      />

      <section>
        <SectionTitle>라디오 신청 원클릭</SectionTitle>
        <RadioOneclick />
      </section>

      <section>
        <SectionTitle>방송사별 편성표</SectionTitle>
        <p className="mb-3 text-xs text-muted">
          방송사별 전체 편성은 등록된 이미지 기준으로 확인할 수 있어요.
        </p>
        <RadioSchedule />
      </section>
    </div>
  );
}
