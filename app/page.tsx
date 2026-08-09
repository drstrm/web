import Image from "next/image";
import BannerSlider from "@/components/BannerSlider";
import Calendar from "@/components/Calendar";
import SmartLink from "@/components/SmartLink";
import TodoList from "@/components/TodoList";
import { Card, SectionTitle } from "@/components/ui";
import {
  getBanners,
  getCalendarEvents,
  getMvStats,
  getPreorderShops,
  getQuickLinks,
  getRealtimeChart,
  getTodoList,
} from "@/lib/content";
import { DREAM_OFFICIAL } from "@/lib/site";

// ISR: PLAVE 레퍼런스와 동일하게 300초 재검증 (A안)
export const revalidate = 300;

export default async function Home() {
  const chart = getRealtimeChart();
  // 배너 · 바로가기(노션) · 캘린더 · 할일(공용 schedules 테이블) 을 한 번에 병렬 조회
  const [banners, quickLinks, events, todos] = await Promise.all([
    getBanners(),
    getQuickLinks(),
    getCalendarEvents(),
    getTodoList(),
  ]);
  const mv = getMvStats();
  const preorders = getPreorderShops();

  return (
    <div className="space-y-10">
      {/* 슬라이드 배너 (노션 DB) */}
      <BannerSlider banners={banners} />

      {/* 바로가기 아이콘 (노션 DB) — 조회 실패 시 섹션째 감춘다 */}
      {quickLinks.length > 0 && (
        <section>
          <SectionTitle>바로가기</SectionTitle>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {quickLinks.map((q) => (
              <SmartLink key={q.key} href={q.href}>
                <div className="flex h-full flex-col items-center gap-2 rounded-2xl border bg-surface p-4 shadow-sm transition-transform active:scale-95">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-2xl">
                    {q.emoji}
                  </span>
                  <span className="text-center text-xs font-bold text-balance">
                    {q.label}
                  </span>
                </div>
              </SmartLink>
            ))}
          </div>
        </section>
      )}

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
            <Calendar events={events} />
          </Card>
        </div>

        <div>
          <SectionTitle>To Do List</SectionTitle>
          <Card>
            <TodoList todos={todos} />
          </Card>
        </div>
      </section>

      {/* NCT DREAM 프로필 */}
      <section>
        <SectionTitle>NCT DREAM</SectionTitle>
        <Card className="overflow-hidden !p-0">
          {/*
           * 원본(1024×874)은 위·아래에 남색 레터박스가 인화돼 있다.
           * 16:9 로 잘라내며 object-position 을 60% 로 내려 그 여백만 정확히
           * 걷어내고 멤버 얼굴은 모두 남긴다.
           */}
          <div className="relative aspect-[16/9] bg-[#12283c]">
            <Image
              src="/profile/dream_profile.png"
              alt="NCT DREAM 단체 이미지"
              fill
              sizes="(max-width: 1024px) 100vw, 992px"
              className="object-cover object-[center_60%]"
            />
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {DREAM_OFFICIAL.map((s) => (
              <SmartLink
                key={s.label}
                href={s.href}
                className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-sky-50"
              >
                {s.label}
              </SmartLink>
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
                <SmartLink
                  key={p.name}
                  href={p.href}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-sky-50"
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-xs text-muted">{p.kind}</span>
                </SmartLink>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
