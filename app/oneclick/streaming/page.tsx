import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { STREAMING_LISTS } from "@/lib/oneclick";

export const metadata: Metadata = { title: "스밍리스트 원클릭" };
export const revalidate = 300;

export default function OneclickStreamingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="ONECLICK"
        title="스밍리스트"
        description="누르면 각 플랫폼의 스트리밍 재생목록이 바로 열립니다."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {STREAMING_LISTS.map((s) => (
          <a
            key={s.platform}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-sm transition-transform active:scale-[0.98]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-xl">
              {s.emoji}
            </span>
            <span className="font-bold">{s.platform}</span>
            <span className="ml-auto text-sky-500">▶</span>
          </a>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        * 재생목록 링크는 컴백 시 최신 음원 기준으로 업데이트됩니다.
      </p>
    </div>
  );
}
