import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "가이드" };

const CATEGORIES = [
  {
    href: "/guide/streaming",
    emoji: "🎧",
    title: "스트리밍 가이드",
    desc: "멜론·지니·벅스·플로·스포티파이 등 플랫폼별 음원/MV 스트리밍",
  },
  {
    href: "/guide/voting",
    emoji: "🗳️",
    title: "투표",
    desc: "음악방송 · 시상식 투표 앱 가이드",
  },
  {
    href: "/guide/download",
    emoji: "⬇️",
    title: "다운로드 가이드",
    desc: "플랫폼별 음원 · MV 다운로드",
  },
  {
    href: "/guide/etc",
    emoji: "✨",
    title: "기타 가이드",
    desc: "컬러링·벨 설정, 숏폼 제작, 이용권 추천",
  },
];

export default function GuideIndex() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="스트리밍 가이드"
        description="스밍이 처음이어도 괜찮아요. 캡처 화면 위주로 쉽게 따라 할 수 있게 정리했어요."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-2xl">
              {c.emoji}
            </span>
            <h2 className="mt-3 font-extrabold group-hover:text-sky-600">{c.title}</h2>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
