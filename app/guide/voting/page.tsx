import type { Metadata } from "next";
import GuideList from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { getVotingGuides } from "@/lib/content";

export const metadata: Metadata = { title: "투표 가이드" };
export const revalidate = 300;

export default function VotingGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="투표 가이드"
        description="방송사별 음악방송 투표 앱과 시상식 투표 방법을 안내합니다."
      />
      <GuideList sections={getVotingGuides()} />
    </div>
  );
}
