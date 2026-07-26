/*
 * 사이트 전역 설정 · 링크 데이터
 * ------------------------------------------------------------------
 * A안 아키텍처(Next.js + Vercel + Notion CMS)에서 "관리인이 자주 바꾸는 값"을
 * 한곳에 모은 파일입니다. 지금은 정적 상수이지만, 운영 단계에서는
 * 이 값들을 Notion DB에서 읽어오도록 lib/content.ts 의 fetch 함수로
 * 교체하면 됩니다. (개발자 배포 없이 관리인이 Notion에서 수정 → ISR 재검증)
 */

export const SITE = {
  name: "NCT DREAM 스트리밍팀",
  shortName: "DREAM STRM",
  description:
    "NCT DREAM 스트리밍 · 투표 · 다운로드 가이드와 원클릭을 한곳에. 스밍팀 공식 웹사이트.",
  // 메인 하단: 운영진 구글 계정 이메일
  email: "nctdreamstrm.notice@gmail.com",
  url: "https://example.com",
};

/** 팀 공식 SNS · 소셜 위젯 (기획안 4: 소셜 위젯 연동) */
export const SOCIALS: { label: string; href: string; handle?: string }[] = [
  { label: "X (Twitter)", href: "https://x.com/", handle: "@nctdream_strm" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Weverse", href: "https://weverse.io/" },
  { label: "YouTube", href: "https://youtube.com/" },
  { label: "다음 카페", href: "https://cafe.daum.net/" },
];

/** 문의 채널 (기획안 4: 카카오 오픈프로필) */
export const CONTACTS: { label: string; href: string }[] = [
  { label: "스트리밍팀 문의", href: "https://open.kakao.com/" },
  { label: "이벤트팀 문의", href: "https://open.kakao.com/" },
];

/** DREAM 공식 SNS (홈 프로필 카드) */
export const DREAM_OFFICIAL: { label: string; href: string }[] = [
  { label: "X", href: "https://x.com/NCTsmtown_DREAM" },
  { label: "Instagram", href: "https://instagram.com/nct_dream" },
  { label: "Weverse", href: "https://weverse.io/nctdream" },
  { label: "YouTube", href: "https://youtube.com/@NCTDREAM" },
];

/**
 * 홈 바로가기 아이콘 (기획안 2 · 4: 필수 구현 - 바로가기 기능)
 * 투표 / 스트리밍 / 라디오신청 / 폼 / 헬퍼신청
 */
export const QUICK_LINKS: {
  key: string;
  label: string;
  emoji: string;
  href: string;
  external?: boolean;
}[] = [
  { key: "vote", label: "투표", emoji: "🗳️", href: "/oneclick/voting" },
  { key: "streaming", label: "스트리밍", emoji: "🎧", href: "/oneclick/streaming" },
  { key: "radio", label: "라디오 신청", emoji: "📻", href: "/oneclick/radio" },
  { key: "form", label: "폼 바로가기", emoji: "📝", href: "https://forms.google.com/", external: true },
  { key: "helper", label: "헬퍼 신청", emoji: "🙋", href: "https://forms.google.com/", external: true },
];

/** 홈 슬라이드 배너 (기획안: 현재는 DREAM x 공계 배너 사진으로만 설정) */
export const BANNERS: { id: string; title: string; subtitle?: string; href?: string; tone: "sky" | "champagne" }[] = [
  {
    id: "b1",
    title: "NCT DREAM 컴백",
    subtitle: "스트리밍으로 함께해요",
    href: "/guide/streaming",
    tone: "sky",
  },
  {
    id: "b2",
    title: "음악방송 투표 가이드",
    subtitle: "원클릭으로 간편하게",
    href: "/guide/voting",
    tone: "champagne",
  },
  {
    id: "b3",
    title: "앨범 사전 판매 정리",
    subtitle: "각 앨범사 · 팬덤 공구 링크",
    href: "/#preorder",
    tone: "sky",
  },
];

/** COMMUNITY - Notion 공개 페이지 링크 (기획안 IA) */
export const NOTION = {
  notice: "#",
  faq: "#",
};

/** 전역 내비게이션 구조 (기획안 2: IA) */
export const NAV: {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}[] = [
  { label: "HOME", href: "/" },
  {
    label: "GUIDE",
    href: "/guide",
    children: [
      { label: "스트리밍 가이드", href: "/guide/streaming" },
      { label: "투표", href: "/guide/voting" },
      { label: "다운로드 가이드", href: "/guide/download" },
      { label: "기타 가이드", href: "/guide/etc" },
    ],
  },
  {
    label: "ONECLICK",
    href: "/oneclick",
    children: [
      { label: "스밍리스트", href: "/oneclick/streaming" },
      { label: "투표 원클릭", href: "/oneclick/voting" },
      { label: "라디오", href: "/oneclick/radio" },
    ],
  },
  {
    label: "COMMUNITY",
    href: "/community",
    children: [
      { label: "공지사항", href: "/community/notice" },
      { label: "FAQ", href: "/community/faq" },
    ],
  },
];
