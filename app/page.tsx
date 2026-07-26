import Link from "next/link";
import BannerSlider from "@/components/BannerSlider";
import { Card, SectionTitle } from "@/components/ui";
import {
  getCalendarEvents,
  getMvStats,
  getPreorderShops,
  getRealtimeChart,
  getTodoList,
} from "@/lib/content";
import { DREAM_OFFICIAL, QUICK_LINKS } from "@/lib/site";

// ISR: PLAVE 레퍼런스와 동일하게 300초 재검증 (A안)
export const revalidate = 300;

/** 다가오는 일정 순서로 정렬 (연도 무시, 월-일 기준) */
function upcoming(events: ReturnType<typeof getCalendarEvents>) {
  const now = new Date();
  const md = (d: string) => {
    const [, m, day] = d.split("-").map(Number);
    const cur = now.getMonth() * 100 + now.getDate();
    const val = m * 100 + day;
    return val >= cur ? val - cur : val - cur + 1231;
  };
  return [...events].sort((a, b) => md(a.date) - md(b.date)).slice(0, 5);
}

const TYPE_EMOJI: Record<string, string> = {
  debut: "🎂",
  birthday: "🎈",
  vote: "🗳️",
  chart: "📊",
};

export default function Home() {
  const chart = getRealtimeChart();
  const events = upcoming(getCalendarEvents());
  const todos = getTodoList();
  const mv = getMvStats();
  const preorders = getPreorderShops();

  return (
    <div className="space-y-10">
      {/* 슬라이드 배너 */}
      <BannerSlider />

      {/* 바로가기 아이콘 */}
      <section>
        <SectionTitle>바로가기</SectionTitle>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {QUICK_LINKS.map((q) => {
            const inner = (
              <div className="flex flex-col items-center gap-2 rounded-2xl border bg-surface p-4 shadow-sm transition-transform active:scale-95">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-2xl">
                  {q.emoji}
                </span>
                <span className="text-xs font-bold">{q.label}</span>
              </div>
            );
            return q.external ? (
              <a key={q.key} href={q.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <Link key={q.key} href={q.href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 유튜브 MV + 실시간 차트 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>유튜브 MV</SectionTitle>
          <Card>
            {mv.map((m) => (
              <div key={m.title} className="space-y-3">
                <div className="grid aspect-video place-items-center rounded-xl bg-sky-50 text-sm text-muted">
                  {m.youtubeId ? (
                    <iframe
                      className="h-full w-full rounded-xl"
                      src={`https://www.youtube.com/embed/${m.youtubeId}`}
                      title={m.title}
                      allowFullScreen
                    />
                  ) : (
                    "MV 임베드 연동 예정"
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{m.title}</span>
                  <span className="text-muted">
                    ▶ {m.views} · ♥ {m.likes}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionTitle>실시간 차트</SectionTitle>
          <Card>
            <p className="mb-3 text-xs text-muted">업데이트: {chart.updatedAt}</p>
            <ul className="divide-y">
              {chart.rows.map((r) => (
                <li key={r.platform} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-semibold">{r.platform}</span>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sm font-bold text-sky-600">
                    {r.rank}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* 캘린더 / To Do */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>캘린더</SectionTitle>
          <Card>
            <ul className="space-y-2.5">
              {events.map((e) => (
                <li key={e.label} className="flex items-center gap-3">
                  <span className="text-lg">{TYPE_EMOJI[e.type]}</span>
                  <span className="text-sm font-semibold">{e.label}</span>
                  <span className="ml-auto text-xs text-muted">
                    {e.date.slice(5).replace("-", ".")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-muted">
              * 음방 투표 기간 · 써클차트 마감일은 컴백일 확정 시 추가됩니다.
            </p>
          </Card>
        </div>

        <div>
          <SectionTitle>To Do List</SectionTitle>
          <Card>
            <ul className="space-y-2">
              {todos.map((t) => (
                <li
                  key={t.label}
                  className="flex items-center gap-3 rounded-xl bg-sky-50/60 px-3 py-2.5"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md border bg-surface text-xs">
                    {t.done ? "✓" : ""}
                  </span>
                  <span className="text-sm font-semibold">{t.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-muted">
              * 컴백 기간 동안 매일 해야 하는 투표 · 스밍 리스트입니다.
            </p>
          </Card>
        </div>
      </section>

      {/* NCT DREAM 프로필 */}
      <section>
        <SectionTitle>NCT DREAM</SectionTitle>
        <Card className="overflow-hidden !p-0">
          <div className="grid aspect-[21/9] place-items-center sky-gradient text-white">
            <div className="text-center">
              <p className="text-2xl font-extrabold">NCT DREAM</p>
              <p className="text-sm opacity-90">단체 이미지 (컴백 이후 교체 예정)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {DREAM_OFFICIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-sky-50"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Card>
      </section>

      {/* 앨범 사전 판매 정리 */}
      <section id="preorder" className="scroll-mt-20">
        <SectionTitle>앨범 사전 판매 · 공구 정리</SectionTitle>
        <Card>
          {preorders.length === 0 ? (
            <div className="rounded-xl bg-champagne/15 py-6 text-center">
              <span className="text-3xl">📦</span>
              <p className="mt-2 font-bold text-[#5a4a1f]">오픈 예정입니다</p>
              <p className="mt-1 text-xs text-muted">
                사전 예약 판매 시작 시 각 앨범사 · 팬덤 공구 링크를 정리해 업데이트합니다.
                (공구주분 동의 후)
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {preorders.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-sky-50"
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-xs text-muted">{p.kind}</span>
                </a>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
