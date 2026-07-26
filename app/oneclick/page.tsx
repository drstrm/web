import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "원클릭" };

const CATEGORIES = [
  {
    href: "/oneclick/streaming",
    emoji: "🎧",
    title: "스밍리스트",
    desc: "플랫폼별 스트리밍 재생목록 원클릭 바로 실행",
  },
  {
    href: "/oneclick/voting",
    emoji: "🗳️",
    title: "투표 원클릭",
    desc: "앱 투표 바로가기 · 문자 투표 원클릭 생성",
  },
  {
    href: "/oneclick/radio",
    emoji: "📻",
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
      />
      <div className="grid gap-4 sm:grid-cols-3">
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
