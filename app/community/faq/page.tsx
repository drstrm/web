import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { NOTION } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ" };
export const revalidate = 300;

const TOPICS = ["아이디 기부 관련", "스트리밍 관련", "이벤트 관련"];

export default function FaqPage() {
  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title="자주 묻는 질문"
        description="궁금한 점을 모았습니다. 전체 FAQ는 Notion에서 관리됩니다."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <span
            key={t}
            className="rounded-full border bg-surface px-4 py-2 text-xs font-bold text-muted"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border bg-surface p-6 text-center shadow-sm">
        <span className="text-4xl">❓</span>
        <h2 className="mt-3 text-lg font-extrabold">전체 FAQ 보기</h2>
        <p className="mt-1 text-sm text-muted">
          아이디 기부·스트리밍·이벤트 관련 자주 묻는 질문을 확인하세요.
        </p>
        <a
          href={NOTION.faq}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl sky-gradient px-6 py-3.5 text-sm font-bold text-white shadow-md"
        >
          FAQ 열기 ↗
        </a>
      </div>
    </div>
  );
}
