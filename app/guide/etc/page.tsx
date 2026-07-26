import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { getEtcGuides } from "@/lib/content";

export const metadata: Metadata = { title: "기타 가이드" };
export const revalidate = 300;

export default function EtcGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="기타 가이드"
        description="컬러링·벨 설정, 숏폼 제작, 이용권 추천 가이드입니다."
      />
      <GuideList sections={getEtcGuides()} />
    </div>
  );
}
