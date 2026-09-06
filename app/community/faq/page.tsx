import { ArrowUpRight, CircleQuestionMark } from "lucide-react";
import type { Metadata } from "next";
import SmartLink from "@/components/SmartLink";
import { Badge, Button, Card, IconTile, PageHeader } from "@/components/ui";
import { iconForRoute } from "@/lib/nav-icons";
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
        icon={iconForRoute("/community/faq")}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <Badge key={t} variant="outline" size="lg">
            {t}
          </Badge>
        ))}
      </div>

      <Card className="flex flex-col items-center p-8 text-center">
        <IconTile tone="sky" size="xl">
          <CircleQuestionMark strokeWidth={2.2} />
        </IconTile>
        <h2 className="mt-4 text-lg font-extrabold">전체 FAQ 보기</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted text-pretty">
          아이디 기부·스트리밍·이벤트 관련 자주 묻는 질문을 확인하세요.
        </p>
        <Button asChild variant="primary" size="lg" className="mt-5">
          <SmartLink href={NOTION.faq}>
            FAQ 열기
            <ArrowUpRight strokeWidth={2.5} />
          </SmartLink>
        </Button>
      </Card>
    </div>
  );
}
