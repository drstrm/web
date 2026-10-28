/*
 * 번역 용어집 — 팬덤 용어 · 고유명사 · 번역 금지 목록
 * ==================================================================
 * scripts/i18n-sync.mjs 가 번역을 요청할 때 시스템 프롬프트에 그대로 싣는다.
 * 앱 런타임은 이 파일을 읽지 않는다 (빌드 도구 전용이라 scripts/ 아래 둔다).
 *
 * ⚠ 기계번역이 가장 많이 틀리는 지점이 여기다. 「스밍」을 humming 으로,
 *   「공구」를 tool 로, 「특전」을 special benefit 로 옮기면 해외 팬이 못 읽는다.
 *   오역을 발견하면 이 파일에 한 줄 더하는 것이 번역문을 손으로 고치는 것보다
 *   낫다 — 다음 번역부터 전부 고쳐진다.
 */

/**
 * 팬덤 · 스트리밍 용어. 「이 말은 이렇게 옮겨라」를 못박는다.
 * 설명(note)은 모델이 문맥을 고르는 데 쓴다 — 번역문에 나오지 않는다.
 */
export const TERMS = [
  { ko: "스밍", en: "streaming", note: "팬이 조직적으로 하는 음원 스트리밍" },
  { ko: "스밍리스트", en: "streaming playlist" },
  { ko: "총공", en: "organized fan push", note: "팬덤이 날을 정해 함께 하는 집중 활동" },
  { ko: "공구 / 공동구매", en: "group order", note: "팬이 모아서 하는 공동 구매. tool 이 아니다" },
  { ko: "공구주", en: "group order host" },
  { ko: "특전", en: "inclusions", note: "앨범에 들어가는 포토카드 · 포스터 등. 「special benefit」 금지" },
  { ko: "이용권", en: "subscription pass", note: "음원 플랫폼 정기 결제권" },
  { ko: "음방", en: "music show", note: "방송사 음악 순위 프로그램" },
  { ko: "음원", en: "audio", note: "MV(영상)와 구분되는 음원. 「sound source」 금지" },
  { ko: "선공개", en: "pre-release" },
  { ko: "컴백", en: "comeback" },
  { ko: "예약판매 / 예판", en: "pre-order" },
  { ko: "헬퍼", en: "helper", note: "총공 · 이벤트를 돕는 자원 팬" },
  { ko: "원클릭", en: "one-click" },
  { ko: "아이디 생성", en: "creating an account" },
  { ko: "사연", en: "radio message", note: "라디오에 보내는 신청 문자" },
  { ko: "편성표", en: "schedule", note: "라디오 방송 시간표" },
  { ko: "시상식", en: "awards show" },
  { ko: "데뷔일", en: "debut anniversary" },
  { ko: "써클차트", en: "Circle Chart", note: "한국 음악 차트 기관 고유명" },
  { ko: "바로가기", en: "shortcuts" },
  { ko: "폼", en: "form", note: "구글폼 · 네이버폼 등 신청 양식" },
];

/**
 * 고유명사 — **어느 언어에서도 그대로 둔다.**
 * 번역하면 해외 팬이 앱스토어 · 판매처에서 못 찾는다.
 */
export const KEEP_AS_IS = [
  // 팀 · 아티스트
  "NCT DREAM", "DREAM STRM", "DREAM AFTER DREAM",
  // 음원 플랫폼 (한국 서비스라 UI 자체가 한국어다 — 영문 표기를 병기한다)
  "멜론 (Melon)", "지니 (Genie)", "벅스 (Bugs)", "플로 (FLO)", "바이브 (VIBE)",
  "Spotify", "Apple Music", "YouTube Music",
  // 투표 앱
  "뮤빗 (Mubeat)", "아이돌챔프 (Idol Champ)", "Mnet Plus", "MUniverse",
  // 앨범 판매처
  "SMTOWN &STORE", "Weverse Shop", "Ktown4U", "YES24", "알라딘 (Aladin)",
  "Makestar", "Soundwave", "Hottracks", "withmuu", "Berriz",
  // 라디오 (방송사 · 프로그램명)
  "SBS 파워FM", "SBS 러브FM", "KBS COOL FM", "MBC FM4U", "MBC 표준FM",
  // 소셜
  "Weverse", "X (Twitter)", "Instagram", "다음 카페 (Daum Cafe)",
];

/**
 * 언어별 추가 지시. 팬덤 용어는 영어권 밖에서도 영어 그대로 쓰는 경우가 많다
 * (인도네시아 · 태국 팬덤이 "streaming" · "group order" 를 그대로 쓴다).
 */
export const LOCALE_NOTES = {
  en: "자연스러운 구어체 영어. 팬덤이 실제로 쓰는 말을 고른다.",
  id: "Bahasa Indonesia. 팬덤에 이미 영어로 굳은 말(streaming · group order · pre-order)은 영어를 그대로 둔다.",
  th: "ภาษาไทย. 팬덤 용어는 영어 차용어를 그대로 쓰는 쪽이 자연스럽다.",
  ja: "日本語. K-POP 팬덤의 일본어 관용 표기를 따른다 (「ストリーミング」 「共同購入」 「特典」).",
  zh: "简体中文. K-POP 팬덤의 중국어 관용 표기를 따른다 (「打榜」 「团购」 「特典」).",
};

/** 시스템 프롬프트에 들어갈 용어집 본문을 만든다 */
export function glossaryPrompt(locale) {
  const terms = TERMS.map(
    (t) => `  · ${t.ko} → ${t.en}${t.note ? `  (${t.note})` : ""}`,
  ).join("\n");
  const keep = KEEP_AS_IS.map((k) => `  · ${k}`).join("\n");

  return `## 팬덤 용어 (영어 기준 — 대상 언어에 맞게 옮긴다)
${terms}

## 고유명사 — 번역하지 말고 그대로 둔다
${keep}

## 이 언어에 대한 지시
  ${LOCALE_NOTES[locale] ?? "자연스러운 현대 구어체로 옮긴다."}`;
}
