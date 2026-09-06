import type { Metadata } from "next";
import { HubCard, PageHeader } from "@/components/ui";
import { FORM_PAGES } from "@/lib/content";
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
  // 폼 · 헬퍼는 헤더 COMMUNITY 메뉴와 같은 묶음이라 이 화면에서도 같이 보여준다.
  // 문구는 각 페이지와 어긋나지 않게 FORM_PAGES 에서 그대로 가져온다.
  {
    href: FORM_PAGES.form.href,
    title: FORM_PAGES.form.title,
    desc: FORM_PAGES.form.description,
  },
  {
    href: FORM_PAGES.helper.href,
    title: FORM_PAGES.helper.title,
    desc: FORM_PAGES.helper.description,
  },
];

export default function CommunityIndex() {
  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title="커뮤니티"
        description="공지 · FAQ · 신청 폼은 운영진이 Notion에서 직접 관리해 항상 최신 상태로 유지됩니다."
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
