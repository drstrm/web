import type { Metadata } from "next";
import SmartLink from "@/components/SmartLink";
import { PageHeader } from "@/components/ui";
import { GUIDE_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "가이드" };

export default function GuideIndex() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="스트리밍 가이드"
        description="스밍이 처음이어도 괜찮아요. 캡처 화면 위주로 쉽게 따라 할 수 있게 정리했어요."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDE_PAGES.map((c) => (
          <SmartLink
            key={c.href}
            href={c.href}
            className="group rounded-2xl border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-2xl">
              {c.emoji}
            </span>
            <h2 className="mt-3 font-extrabold group-hover:text-sky-600">{c.title}</h2>
            <p className="mt-1 text-sm text-muted">{c.summary}</p>
          </SmartLink>
        ))}
      </div>
    </div>
  );
}
