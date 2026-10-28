/*
 * 사이트 전역 설정 · 링크 데이터
 * ------------------------------------------------------------------
 * A안 아키텍처(Next.js + Vercel + Notion CMS)에서 "관리인이 자주 바꾸는 값"을
 * 한곳에 모은 파일입니다. 지금은 정적 상수이지만, 운영 단계에서는
 * 이 값들을 Notion DB에서 읽어오도록 lib/content.ts 의 fetch 함수로
 * 교체하면 됩니다. (개발자 배포 없이 관리인이 Notion에서 수정 → ISR 재검증)
 */

export const SITE = {
  /*
   * 팀 이름(「NCT DREAM 스트리밍팀」)은 여기 없다 — messages 의 `meta.siteName`.
   * shortName 은 브랜드 표기라 어느 언어에서도 그대로 쓴다.
   */
  shortName: "DREAM STRM",
  /*
   * 사이트 설명은 messages 의 `meta.description` 에 있다. 여기 두면 언어별로
   * 바꿀 수 없어서 공유 카드 · 검색 결과가 전 언어 한국어로 나간다.
   */
  // 메인 하단: 운영진 구글 계정 이메일
  email: "nctdreamstrm.notice@gmail.com",
  url: "https://dreamstrm.com",
};

/**
 * 팀 공식 SNS · 소셜 위젯 (기획안 4: 소셜 위젯 연동)
 *
 * X · Weverse 는 서비스 이름이라 그대로 두고, 「다음 카페」만 번역 키를 쓴다 —
 * 해외 팬에게는 「Daum Cafe」로 보여야 어디인지 짚힌다.
 */
export const SOCIALS: { label?: string; labelKey?: string; href: string }[] = [
  { label: "X (Twitter)", href: "https://x.com/NCTDREAM_STRM_" },
  { label: "Weverse", href: "https://weverse.io/nctdream/profile/81afe4cbdabcf25a1e728cf38c19f8d3" },
  { labelKey: "social.daumCafe", href: "https://m.cafe.daum.net/NCTDREAMstreaming" },
];

/** 문의 채널 (기획안 4: 카카오 오픈프로필) */
export const CONTACTS: { labelKey: string; href: string }[] = [
  { labelKey: "contact.streamingTeam", href: "https://pf.kakao.com/_dxdwxbxj" },
  { labelKey: "contact.eventTeam", href: "https://pf.kakao.com/_hFlxkxj" },
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

/**
 * 전역 내비게이션 구조 (기획안 2: IA)
 * ------------------------------------------------------------------
 * 라벨을 여기 적지 않고 **번역 키**(`labelKey`)만 둔다. 문구는
 * messages/<언어>.json 의 `nav` 묶음에 있고, 헤더 · 모바일 메뉴가 t() 로 꺼낸다.
 *
 * HOME · GUIDE · ONECLICK · COMMUNITY 는 디자인상 영문 대문자 그대로 쓰는
 * 자리라(font-display) 번역 대상이 아니다 — 1단 라벨은 코드에 그대로 둔다.
 */
export const NAV: {
  label: string;
  href: string;
  children?: { labelKey: string; href: string }[];
}[] = [
  { label: "HOME", href: "/" },
  {
    label: "GUIDE",
    href: "/guide",
    children: [
      { labelKey: "guide.streaming.title", href: "/guide/streaming" },
      { labelKey: "guide.id-generate.title", href: "/guide/id-generate" },
      { labelKey: "nav.voting", href: "/guide/voting" },
      { labelKey: "guide.download.title", href: "/guide/download" },
      { labelKey: "guide.etc.title", href: "/guide/etc" },
    ],
  },
  {
    label: "ONECLICK",
    href: "/oneclick",
    children: [
      { labelKey: "nav.streamingList", href: "/oneclick/streaming" },
      { labelKey: "nav.votingOneclick", href: "/oneclick/voting" },
      { labelKey: "nav.radio", href: "/oneclick/radio" },
    ],
  },
  {
    label: "COMMUNITY",
    href: "/community",
    children: [
      { labelKey: "nav.notice", href: "/community/notice" },
      { labelKey: "nav.faq", href: "/community/faq" },
      { labelKey: "form.form.title", href: "/community/forms" },
      { labelKey: "form.helper.title", href: "/community/helper" },
      /*
       * 앨범 예약판매는 컴백 때만 쓰는 메뉴라 COMMUNITY 안에 둔다. 예약판매가
       * 끝나면 이 줄만 지우면 메뉴에서 빠지고, 페이지(/community/album)는 그대로
       * 남아 이미 공유된 링크가 산다.
       */
      { labelKey: "nav.album", href: "/community/album" },
    ],
  },
];
