import type { Metadata } from "next";
import { PageHeader, SectionTitle } from "@/components/ui";
import { RADIO_APPLY, RADIO_SCHEDULE } from "@/lib/oneclick";

export const metadata: Metadata = { title: "라디오 원클릭" };
export const revalidate = 300;

export default function OneclickRadioPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="ONECLICK"
        title="라디오"
        description="방송사별 라디오 시간표와 신청 원클릭입니다."
      />

      <section>
        <SectionTitle>방송사별 라디오 시간표</SectionTitle>
        <div className="overflow-hidden rounded-2xl border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-sky-50 text-left text-xs text-muted">
                <th className="px-4 py-3 font-bold">방송사</th>
                <th className="px-4 py-3 font-bold">프로그램</th>
                <th className="px-4 py-3 font-bold">시간</th>
              </tr>
            </thead>
            <tbody>
              {RADIO_SCHEDULE.map((r) => (
                <tr key={r.station} className="border-b last:border-0">
                  <td className="px-4 py-3 font-bold">{r.station}</td>
                  <td className="px-4 py-3">{r.program}</td>
                  <td className="px-4 py-3 text-muted">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle>라디오 신청 원클릭</SectionTitle>
        <p className="mb-3 text-xs text-muted">
          운영체제에 맞는 앱으로 신청하세요. (안드로이드 / iOS 별도)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {RADIO_APPLY.map((r) => (
            <div key={r.station} className="rounded-2xl border bg-surface p-4 shadow-sm">
              <p className="font-bold">{r.station}</p>
              <div className="mt-3 flex gap-2">
                <a
                  href={r.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl sky-gradient px-3 py-2.5 text-center text-xs font-bold text-white"
                >
                  🤖 안드로이드
                </a>
                <a
                  href={r.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl border px-3 py-2.5 text-center text-xs font-bold hover:bg-sky-50"
                >
                   iOS
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
