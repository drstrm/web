import type { Metadata } from "next";
import { HubCard, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";

export const metadata: Metadata = { title: "커뮤니티" };

const CATEGORIES = [
  {
    href: "/community/notice",
    title: "공지사항",
    desc: "팀 공식 공지 · 이벤트 안내",
  },
  {
    href: "/community/faq",
    title: "자주 묻는 질문",
    desc: "아이디 기부 · 스트리밍 · 이벤트 관련 FAQ",
  },
];

export default function CommunityIndex() {
  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title="커뮤니티"
        description="공지와 FAQ는 운영진이 Notion에서 직접 관리해 항상 최신 상태로 유지됩니다."
        icon={iconForRoute("/community")}
      />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {CATEGORIES.map((c) => (
          <HubCard key={c.href} href={c.href} title={c.title} description={c.desc} />
        ))}
      </div>
    </div>
  );
}
