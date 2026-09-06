import { ArrowUpRight, Link2, Package, TrendingUp } from "lucide-react";
import BannerSlider from "@/components/BannerSlider";
import Calendar from "@/components/Calendar";
import LoadingImage from "@/components/LoadingImage";
import MvCard from "@/components/MvCard";
import SmartLink from "@/components/SmartLink";
import TodoList from "@/components/TodoList";
import { Card, EmptyState, IconTile, SectionTitle } from "@/components/ui";
import {
  getBanners,
  getCalendarEvents,
  getMvStats,
  getPreorderShops,
  getQuickLinks,
  getRealtimeChart,
  getTodoList,
  type QuickLink,
} from "@/lib/content";
import { DREAM_OFFICIAL } from "@/lib/site";

// ISR: PLAVE 레퍼런스와 동일하게 300초 재검증 (A안)
export const revalidate = 300;

export default async function Home() {
  const chart = getRealtimeChart();
  // 배너 · 바로가기 · 캘린더 · 할일(공용 일정 DB) — 전부 노션이고 한 번에 병렬 조회
  const [banners, quickLinks, events, todos] = await Promise.all([
    getBanners(),
    getQuickLinks(),
    getCalendarEvents(),
    getTodoList(),
  ]);
  const mv = getMvStats();
  const preorders = getPreorderShops();

  return (
    <div className="space-y-12">
      {/* 슬라이드 배너 (노션 DB) */}
      <BannerSlider banners={banners} />

      {/* 바로가기 아이콘 (노션 DB) — 조회 실패 시 섹션째 감춘다 */}
      {quickLinks.length > 0 && (
        <section>
          <SectionTitle>바로가기</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
            {quickLinks.map((q) => (
              <QuickLinkTile key={q.key} link={q} />
            ))}
          </div>
        </section>
      )}

      {/* 유튜브 MV + 실시간 차트 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>유튜브 MV</SectionTitle>
          <MvCard mv={mv} />
        </div>

        <div>
          <SectionTitle>실시간 차트</SectionTitle>
          <Card>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
              <TrendingUp className="size-3 shrink-0 text-sky-500" strokeWidth={2.5} />
              {chart.updatedAt}
            </p>
            <ul className="divide-y divide-border">
              {chart.rows.map((r) => (
                <li key={r.platform} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate text-sm font-semibold">{r.platform}</span>
                  {/*
                   * 순위가 들어오면 샴페인으로 강조한다. 아직 값이 없는 "—" 는
                   * 옅게 두어 「데이터 대기 중」임이 한눈에 보이게 한다.
                   */}
                  <span
                    className={`inline-flex h-6 min-w-11 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-extrabold leading-none ${
                      r.rank === "—"
                        ? "bg-surface-soft text-muted-soft"
                        : "champagne-gradient text-champagne-ink"
                    }`}
                  >
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
        <Card className="overflow-hidden p-0">
          {/*
           * 원본(1024×874)은 위·아래에 남색 레터박스가 인화돼 있다.
           * 16:9 로 잘라내며 object-position 을 60% 로 내려 그 여백만 정확히
           * 걷어내고 멤버 얼굴은 모두 남긴다.
           */}
          <div className="relative aspect-[16/9] bg-[#12283c]">
            <LoadingImage
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                {s.label}
                <ArrowUpRight className="size-3 shrink-0 text-muted-soft" strokeWidth={2.5} />
              </SmartLink>
            ))}
          </div>
        </Card>
      </section>

      {/* 앨범 사전 판매 정리 */}
      <section id="preorder" className="scroll-mt-24">
        <SectionTitle>앨범 사전 판매 · 공구 정리</SectionTitle>
        {preorders.length === 0 ? (
          <EmptyState
            icon={Package}
            tone="accent"
            title="오픈 예정입니다"
            description="사전 예약 판매가 시작되면 앨범사 · 팬덤 공구 링크를 정리해 올려드릴게요. (공구주분 동의 후)"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {preorders.map((p) => (
              <SmartLink
                key={p.name}
                href={p.href}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lift"
              >
                <span className="min-w-0 truncate font-bold">{p.name}</span>
                <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-sky-100 px-2.5 text-[11px] font-bold leading-none text-sky-700">
                  {p.kind}
                </span>
              </SmartLink>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * 바로가기 타일 한 칸.
 * ------------------------------------------------------------------
 * 아이콘은 운영진이 노션 `emoji` 열에 적은 이모지를 그대로 쓴다. 어떤 버튼을
 * 어떤 그림으로 둘지는 코드가 아니라 노션에서 정하는 값이라, 배포 없이 바꿀 수
 * 있어야 한다. (열이 비어 있으면 노션 조회 단계에서 🔗 이 들어온다)
 *
 * 이모지는 폰트마다 글자 상자보다 크게 그려지므로, `leading-none` 을 준
 * IconTile(grid place-items-center) 안에 넣어 타일 정중앙에 놓는다.
 */
function QuickLinkTile({ link }: { link: QuickLink }) {
  return (
    <SmartLink href={link.href} className="group">
      <div className="flex h-full flex-col items-center gap-2.5 rounded-2xl border border-border bg-surface p-3.5 shadow-card transition-all group-hover:-translate-y-0.5 group-hover:border-champagne-300 group-hover:shadow-lift active:scale-95">
        <IconTile
          size="lg"
          className="transition-colors group-hover:bg-champagne-400 group-hover:text-champagne-ink"
        >
          {link.emoji ? (
            <span aria-hidden className="text-xl leading-none">
              {link.emoji}
            </span>
          ) : (
            <Link2 strokeWidth={2.2} />
          )}
        </IconTile>
        <span className="text-center text-xs font-bold leading-snug text-balance">
          {link.label}
        </span>
      </div>
    </SmartLink>
  );
}
