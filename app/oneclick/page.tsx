import type { Metadata } from "next";
import { HubCard, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";

export const metadata: Metadata = { title: "원클릭" };

const CATEGORIES = [
  {
    href: "/oneclick/streaming",
    title: "스밍리스트",
    desc: "플랫폼별 스트리밍 재생목록 원클릭 바로 실행",
  },
  {
    href: "/oneclick/voting",
    title: "투표 원클릭",
    desc: "앱 투표 바로가기 · 문자 투표 원클릭 생성",
  },
  {
    href: "/oneclick/radio",
    title: "라디오",
    desc: "방송사별 라디오 시간표 · 신청 원클릭",
  },
];

export default function OneclickIndex() {
  return (
    <div>
      <PageHeader
        eyebrow="ONECLICK"
        title="원클릭"
        description="한 번의 터치로 스밍·투표·라디오 신청까지. 링크만 누르면 바로 실행돼요."
        icon={iconForRoute("/oneclick")}
      />
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {CATEGORIES.map((c) => (
          <HubCard key={c.href} href={c.href} title={c.title} description={c.desc} />
        ))}
      </div>
    </div>
  );
}
