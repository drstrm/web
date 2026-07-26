import type { Metadata } from "next";
import SmsVote from "@/components/SmsVote";
import VoteApps from "@/components/VoteApps";
import { PageHeader, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "투표 원클릭" };
export const revalidate = 300;

export default function OneclickVotingPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="ONECLICK"
        title="투표 원클릭"
        description="투표 앱 바로가기와 문자 투표를 한 번에."
      />

      <section>
        <SectionTitle>앱 투표 바로가기</SectionTitle>
        <VoteApps />
      </section>

      <section>
        <SectionTitle>문자 투표</SectionTitle>
        <SmsVote />
      </section>
    </div>
  );
}
