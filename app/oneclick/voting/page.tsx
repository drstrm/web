import type { Metadata } from "next";
import SmsVote from "@/components/SmsVote";
import VoteApps from "@/components/VoteApps";
import { PageHeader, SectionTitle } from "@/components/ui";
import { getActiveVotes } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";

export const metadata: Metadata = { title: "투표 원클릭" };
// 투표는 열리고 닫히는 순간이 중요하다 — 다른 페이지(300초)보다 짧게 잡는다.
export const revalidate = 60;

export default async function OneclickVotingPage() {
  /*
   * 첫 목록은 서버에서 그린다. 브라우저가 처음부터 받아오면 화면이 「진행중 없음」
   * 으로 한 번 그려진 뒤 카드가 위로 올라와 출렁인다. 이후 갱신은 VoteApps 가
   * /api/votes 로 1분마다 한다. 조회에 실패하면 빈 배열이라 화면은 대기 상태다.
   */
  const votes = await getActiveVotes();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="ONECLICK"
        title="투표 원클릭"
        description="투표 앱 바로가기와 문자 투표를 한 번에."
        icon={iconForRoute("/oneclick/voting")}
      />

      <section>
        <SectionTitle>앱 투표</SectionTitle>
        <VoteApps initialVotes={votes} />
      </section>

      <section>
        <SectionTitle>문자 투표</SectionTitle>
        <SmsVote />
      </section>
    </div>
  );
}
