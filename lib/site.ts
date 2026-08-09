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
  { label: "X (Twitter)", href: "https://x.com/", handle: "@NCTDREAM_STRM_" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Weverse", href: "https://weverse.io/" },
  { label: "YouTube", href: "https://youtube.com/" },
  { label: "다음 카페", href: "https://cafe.daum.net/" },
];

/** 문의 채널 (기획안 4: 카카오 오픈프로필) */
export const CONTACTS: { label: string; href: string }[] = [
  { label: "스트리밍팀 문의", href: "https://pf.kakao.com/_dxdwxbxj" },
  { label: "이벤트팀 문의", href: "https://pf.kakao.com/_hFlxkxj" },
];

/** DREAM 공식 SNS (홈 프로필 카드) */
export const DREAM_OFFICIAL: { label: string; href: string }[] = [
  { label: "X", href: "https://x.com/NCTsmtown_DREAM" },
  { label: "Instagram", href: "https://instagram.com/nct_dream" },
  { label: "Weverse", href: "https://weverse.io/nctdream" },
  { label: "YouTube", href: "https://youtube.com/@NCTDREAM" },
];

/*
 * 홈 슬라이드 배너 · 바로가기 아이콘은 여기 있지 않다.
 * 운영진이 노션 DB 에서 직접 관리한다 — lib/content.ts 의 getBanners() ·
 * getQuickLinks(), 스키마는 docs/notion-banner-db.md · docs/notion-links-db.md 참고.
 *
 * 바로가기(기획안 2 · 4 필수 구현)의 기본값을 여기 남겨두지 않는 이유:
 * 노션에서 버튼을 지웠는데 코드의 기본값이 되살아나면 운영진이 손쓸 방법이 없다.
 * 조회에 실패하면 섹션째 감춘다 (헤더 내비게이션으로 같은 곳에 갈 수 있다).
 */

/** COMMUNITY - Notion 공개 페이지 링크 (기획안 IA) */
export const NOTION = {
  notice: "https://app.notion.com/p/nctdreamstrm/393dec8e2bf080b4b0f1deb2ac946d5a",
  faq: "https://app.notion.com/p/nctdreamstrm/FAQ-392dec8e2bf080fd8db0e297d73336a5",
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
      { label: "아이디 생성 가이드", href: "/guide/id-generate" },
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
