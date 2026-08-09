import type { Metadata } from "next";
import SmartLink from "@/components/SmartLink";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "커뮤니티" };

const CATEGORIES = [
  {
    href: "/community/notice",
    emoji: "📢",
    title: "공지사항",
    desc: "팀 공식 공지 · 이벤트 안내",
  },
  {
    href: "/community/faq",
    emoji: "❓",
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
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <SmartLink
            key={c.href}
            href={c.href}
            className="group rounded-2xl border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-2xl">
              {c.emoji}
            </span>
            <h2 className="mt-3 font-extrabold group-hover:text-sky-600">{c.title}</h2>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>
          </SmartLink>
        ))}
      </div>
    </div>
  );
}
