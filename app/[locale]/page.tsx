import { ArrowUpRight, Link2, Music4, TrendingUp } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BannerSlider from "@/components/BannerSlider";
import Calendar from "@/components/Calendar";
import LoadingImage from "@/components/LoadingImage";
import MvCard from "@/components/MvCard";
import PlatformIcon from "@/components/PlatformIcon";
import SmartLink from "@/components/SmartLink";
import TodoList from "@/components/TodoList";
import { Card, HubCard, IconTile, SectionTitle } from "@/components/ui";
import { ALBUM } from "@/lib/album";
import {
  getBanners,
  getCalendarEvents,
  getMvStats,
  getQuickLinks,
  getRealtimeChart,
  getTodoList,
  type QuickLink,
} from "@/lib/content";
import { DREAM_OFFICIAL } from "@/lib/site";

// ISR: PLAVE 레퍼런스와 동일하게 300초 재검증 (A안)
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tAlbum = await getTranslations("album");
  const chart = getRealtimeChart();
  // 배너 · 바로가기 · 캘린더 · 할일(공용 일정 DB) — 전부 노션이고 한 번에 병렬 조회
  const [banners, quickLinks, events, todos] = await Promise.all([
    getBanners(),
    getQuickLinks(),
    getCalendarEvents(),
    getTodoList(),
  ]);
  const mv = getMvStats();

  return (
    <div className="space-y-12">
      {/* 슬라이드 배너 (노션 DB) */}
      <BannerSlider banners={banners} />

      {/* 바로가기 아이콘 (노션 DB) — 조회 실패 시 섹션째 감춘다 */}
      {quickLinks.length > 0 && (
        <section>
          <SectionTitle>{t("shortcuts")}</SectionTitle>
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
          <SectionTitle>{t("youtubeMv")}</SectionTitle>
          <MvCard mv={mv} />
        </div>

        <div>
          <SectionTitle>{t("realtimeChart")}</SectionTitle>
          <Card>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
              <TrendingUp className="size-3 shrink-0 text-sky-500" strokeWidth={2.5} />
              {t("chartWaiting")}
            </p>
            <ul className="divide-y divide-border">
              {chart.rows.map((r) => (
                <li key={r.platform} className="flex items-center gap-2.5 py-2.5">
                  {/* 플랫폼 아이콘 (public/icons). 앱 PNG 라 타일을 꽉 채운다 */}
                  <IconTile tone="sky" size="sm" className="size-5 [&>svg]:size-3">
                    <PlatformIcon iconType={r.iconType} size={28} fallback={<Music4 />} />
                  </IconTile>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {r.platform}
                  </span>
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
          <SectionTitle>{t("calendar")}</SectionTitle>
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
           * 원본(3000×2000 · 3:2)은 카드 비율인 16:9 보다 세로가 길어 15% 쯤을
           * 덜어내야 한다. 멤버들이 화면 한가운데 모여 있는 구도라 위아래를
           * 고르게 잘라내는 가운데 정렬이 얼굴을 가장 안전하게 남긴다.
           */}
          <div className="relative aspect-[16/9] bg-sky-100">
            <LoadingImage
              src="/profile/dream_profile.jpeg"
              alt={t("profileAlt")}
              fill
              sizes="(max-width: 1024px) 100vw, 992px"
              className="object-cover object-center"
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

      {/* 앨범 예약판매 · 공구 (/community/album) */}
      {/*
       * `id="preorder"` 를 그대로 둔다. 노션 바로가기 DB 에 `#preorder` 로 적어 둔
       * 버튼이 있어서, id 를 바꾸면 그 버튼이 조용히 아무 데도 못 간다.
       */}
      <section id="preorder" className="scroll-mt-24">
        <SectionTitle>{t("preorder")}</SectionTitle>
        <HubCard
          href="/community/album"
          title={tAlbum("title")}
          description={t("preorderCard", { period: ALBUM.period })}
        />
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
