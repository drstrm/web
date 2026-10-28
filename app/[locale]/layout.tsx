import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/theme";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

/**
 * 라틴 표시용 서체. 이어브로(GUIDE · ONECLICK) 처럼 영문 대문자로만 쓰이는
 * 자리에서 한글 본문 서체보다 또렷하고 트렌디하게 보인다.
 */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/**
 * 페이지 공통 메타데이터.
 *
 * 언어마다 제목 · 설명이 달라야 하므로 상수가 아니라 함수다 — 상수로 두면
 * 영어판을 공유해도 공유 카드가 한국어로 뜬다.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    // 탭 아이콘(app/favicon.ico · icon.png · apple-icon.png)과 공유 카드
    // (app/opengraph-image.jpg)는 파일 이름으로 자동 연결된다.
    // 공유 이미지는 절대경로여야 해서 metadataBase 가 반드시 있어야 한다.
    metadataBase: new URL(SITE.url),
    title: {
      default: t("title"),
      template: `%s · ${SITE.shortName}`,
    },
    description: t("description"),
    /*
     * 검색엔진에 다른 언어판을 알린다. 미들웨어가 Link 헤더로도 같은 정보를
     * 보내지만(i18n/routing.ts 의 alternateLinks), <head> 에도 있어야 크롤러가
     * 확실히 집어간다. 한국어가 접두어 없는 정본이라 x-default 도 한국어다.
     */
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [
            l,
            l === routing.defaultLocale ? "/" : `/${l}`,
          ]),
        ),
        "x-default": "/",
      },
    },
    openGraph: {
      // title · description 을 여기 고정하지 않는다. 비워두면 Next 가 각 페이지의
      // title/description 을 그대로 끌어다 써서, /guide 를 공유하면 공유 카드에도
      // 「가이드 · DREAM STRM」 이 뜬다. 고정하면 모든 페이지가 같은 문구로 공유된다.
      siteName: SITE.shortName,
      url: "./", // 현재 경로 기준으로 풀린다 (고정하면 전 페이지가 홈 주소로 공유된다)
      locale,
      type: "website",
    },
    // 카카오톡·X 는 큰 이미지 카드로 펼쳐 보여준다
    twitter: { card: "summary_large_image" },
  };
}

/**
 * 팬덤의 90% 이상이 모바일이라 주소창 색까지 테마에 맞춘다.
 * 테마를 고정한 사용자의 주소창은 ThemeToggle 이 이 메타를 덮어써서 맞춘다.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  colorScheme: "light dark",
};

/**
 * 지원 언어를 미리 빌드한다. 이게 없으면 모든 페이지가 요청마다 동적 렌더로
 * 떨어져서 ISR(각 페이지의 `revalidate = 300`)이 사실상 사라진다.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // `[locale]` 은 사실상 캐치올이라 모르는 값이 들어올 수 있다
  if (!hasLocale(routing.locales, locale)) notFound();

  /*
   * 이 요청의 언어를 고정한다. 아래 트리의 서버 컴포넌트가 getTranslations() 로
   * 같은 언어를 보게 되고, **정적 렌더가 유지된다** (없으면 전부 동적이 된다).
   */
  setRequestLocale(locale);

  const t = await getTranslations("layout");

  return (
    <html
      lang={locale}
      className={`${notoSansKr.variable} ${outfit.variable} h-full antialiased`}
      // 아래 스크립트가 data-theme 을 붙이고 시작하므로 서버 HTML 과 다를 수 있다
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/*
         * 저장해 둔 테마를 첫 페인트 전에 적용한다. 본문 맨 앞의 동기 스크립트라
         * 아래 내용이 그려지기 전에 끝난다 — 테마가 번쩍이지 않는 이유다.
         */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        {/*
         * 클라이언트 컴포넌트(Header · Calendar · ThemeToggle …)도 번역을 쓸 수
         * 있게 메시지를 내려보낸다. 서버 컴포넌트에서 렌더되므로 언어 · 메시지 ·
         * 시간대를 알아서 받아 간다 — props 를 넘길 필요가 없다.
         */}
        <NextIntlClientProvider>
          {/* 키보드 사용자가 내비게이션을 건너뛸 수 있게 한다 */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:shadow-lift"
          >
            {t("skipToContent")}
          </a>
          <Header />
          <main
            id="main"
            className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10"
          >
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>

        {/* 방문자 · 페이지뷰 집계 (Vercel Web Analytics) */}
        <Analytics />
      </body>
    </html>
  );
}
