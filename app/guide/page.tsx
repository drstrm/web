import type { Metadata } from "next";
import { HubCard, PageHeader } from "@/components/ui";
import { GUIDE_PAGES } from "@/lib/content";
import { iconForRoute } from "@/lib/nav-icons";

export const metadata: Metadata = { title: "가이드" };

export default function GuideIndex() {
  return (
    <div>
      <PageHeader
        eyebrow="GUIDE"
        title="스트리밍 가이드"
        description="스밍이 처음이어도 괜찮아요. 캡처 화면 위주로 쉽게 따라 할 수 있게 정리했어요."
        icon={iconForRoute("/guide")}
      />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {GUIDE_PAGES.map((c) => (
          <HubCard key={c.href} href={c.href} title={c.title} description={c.summary} />
        ))}
      </div>
    </div>
  );
}
