import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

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

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} 공식 웹사이트`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} 공식 웹사이트`,
    description: SITE.description,
    type: "website",
  },
};

/** 팬덤의 90% 이상이 모바일이라 주소창 색까지 스카이로 맞춘다 */
export const viewport: Viewport = {
  themeColor: "#f6fbff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* 키보드 사용자가 내비게이션을 건너뛸 수 있게 한다 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:shadow-lift"
        >
          본문으로 건너뛰기
        </a>
        <Header />
        <main
          id="main"
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
