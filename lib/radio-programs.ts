/*
 * 라디오 프로그램별 공식 홈페이지 · 요일 코너 (2026-11-11 확인)
 * ------------------------------------------------------------------
 * 원클릭 카드에 「오늘의 코너」와 「공식 홈페이지」 버튼을 띄우는 데 쓴다.
 * 신청 가능성이 있는 프로그램(possibility ≥ 1)만 적는다 — 나머지는 화면에 링크를 띄우지 않는다.
 *
 * 키는 lib/radio.ts 의 RADIO_SCHEDULE `program` 과 **글자 그대로** 같아야 한다.
 *
 * 출처
 *   SBS — 프로그램 홈페이지 메뉴의 「요일코너」 ([월] … 접두사).
 *         https://static.apis.sbs.co.kr/program-api/1.0/menu/{프로그램 코드}
 *   MBC — 프로그램 홈페이지의 「요일코너」. https://control.imbc.com/Radio/{BroadcastID}/Corner
 *   KBS — 홈페이지에 「오늘의 코너」가 있지만 브라우저에서만 그려지는 화면이라 읽어 오지 못했다.
 *         코너는 비워 두고 홈페이지 링크만 둔다.
 *
 * 매일 코너(사연과 신청곡 등)는 적지 않는다. 요일마다 바뀌는 것만 「오늘의 코너」로 보여준다.
 * 개편 때 코너가 바뀌므로, 어긋나 보이면 위 출처를 다시 확인한다.
 */

export type RadioCorner = {
  /** 0=일 ~ 6=토 */
  days: number[];
  name: string;
};

export type RadioProgramInfo = {
  homepage?: string;
  corners?: RadioCorner[];
};

const 일 = 0, 월 = 1, 화 = 2, 수 = 3, 목 = 4, 금 = 5, 토 = 6;
const c = (days: number[], name: string): RadioCorner => ({ days, name });

const SBS = (code: string) => `https://programs.sbs.co.kr/radio/${code}`;
const KBS = (code: string) => `https://program.kbs.co.kr/2fm/radio/${code}/pc/index.html`;
const MBC = (code: string) => `https://program.imbc.com/radio/${code}`;

export const RADIO_PROGRAM_INFO: Record<string, RadioProgramInfo> = {
  // ── SBS 파워FM ──────────────────────────────────
  "애프터 클럽": {
    homepage: SBS("afterclub"),
    corners: [
      c([월], "장들레 들을래"),
      c([화], "슬리피의 Are U Sleepy?"),
      c([수], "미란이의 한 시라니"),
      c([목], "푸디토리움의 야간공작소"),
      c([금], "윤덕원의 이웃에 방해가 되지 않는 선에서"),
      c([토], "임헌일의 폴링 인 러브"),
      c([일], "구름의 사운드클라우드"),
    ],
  },
  "이인권의 펀펀투데이": {
    homepage: SBS("funfun2daying"),
    corners: [
      c([월], "찡구톡"),
      c([화], "Chat잉PT 작명소"),
      c([수], "꽃. 단. 장."),
      c([목], "줄 그어드리는 남자"),
    ],
  },
  "김영철의 파워 FM": { homepage: SBS("0chulpowerfm") },
  "아름다운 이 아침, 봉태규입니다": {
    homepage: SBS("morningbong"),
    corners: [
      c([수], "유치봉짝"),
      c([목], "비공감 댓글"),
      c([금], "개인의 취향 타임, 개.취.타!"),
      c([토], "봉보드 차트"),
      c([일], "1인용 플레이리스트"),
    ],
  },
  "12시엔 주현영": {
    homepage: SBS("sbs12n"),
    corners: [
      c([월], "퍼스널 뮤직 센터"),
      c([화], "환장 연애"),
      c([금], "매일이 시트콤"),
      c([토], "선넘는 참견"),
    ],
  },
  "두시탈출 컬투쇼": {
    homepage: SBS("cultwoshow"),
    corners: [
      c([월], "사연진품명품"),
      c([화], "컬투 작명소"),
      c([목], "한번 더~ 사랑의 고스톱"),
      c([금], "줄노래 시즌2"),
      c([금], "망해본 사연 사구팔구"),
      c([금], "DK의 고막남편"),
    ],
  },
  "황제성의 황제파워": { homepage: SBS("kingcastlepower") },
  "박소현의 러브게임": {
    homepage: SBS("lovegame"),
    corners: [
      c([월], "나만 쓰레기야?"),
      c([화], "신개념 음악퀴즈 뮤직큐"),
      c([수], "러브119"),
      c([목], "네버엔딩 뮤직"),
      c([금], "우리만의 자유로운 차트"),
    ],
  },
  "웬디의 영스트리트": {
    homepage: SBS("wendy0s"),
    corners: [
      c([화], "얼미 수다 캠프"),
      c([목], "웬만해선 그들을 막을 수 없다"),
      c([토], "한주 리뷰"),
      c([토], "영스 뮤직 페스티벌 'YMF'"),
      c([일], "차트자리운세"),
      c([일], "꺼내들어요"),
    ],
  },
  "배성재의 텐": {
    homepage: SBS("ten"),
    corners: [
      c([월], "꿈과 음식 사이"),
      c([화], "대강 결정해드립니다"),
      c([수], "오,좋네 상담소"),
      c([목], "N들이 사는 세상"),
      c([금], "티끌 논쟁"),
      c([토], "먹방월드컵"),
      c([일], "판까지 마.피아"),
    ],
  },
  "딘딘의 뮤직하이": {
    homepage: SBS("dindinmusichigh"),
    corners: [
      c([화], "연.사.친"),
      c([수], "밤에, 라디오에서"),
      c([금], "냉정과 열정 사이"),
      c([토, 일], "버디버디"),
      c([토, 일], "이 밤에 다시 한 번"),
    ],
  },

  // ── SBS 러브FM ──────────────────────────────────
  "DJ래피의 드라이브 뮤직": { homepage: SBS("drivemusic") },
  "그대의 오후, 정엽입니다": { homepage: SBS("sbsnight") },
  "김윤상의 뮤직투나잇": {
    homepage: SBS("musictonight"),
    corners: [
      c([목], "추억소환, 그날 우리는"),
      c([금], "미스터F의 위로법"),
      c([토, 일], "김회장과 챗비서"),
      c([일], "마이차트, 마이송"),
    ],
  },
  "음악이 흐르는 밤, 박은경입니다": {
    homepage: SBS("sbsmusic"),
    corners: [
      c([금], "당신의 문장들"),
      c([토], "잊지 못할 시네마"),
      c([일], "달밤에 고민 상담소"),
    ],
  },

  // ── KBS COOL FM (코너는 못 읽어 옴 — 머리말) ───────────
  "Station Zero": { homepage: KBS("stationzero") },
  "Station X": { homepage: KBS("stationx") },
  "조정식의 FM 대행진": { homepage: KBS("sikfm") },
  "박명수의 라디오쇼": { homepage: KBS("radioshow") },
  "폴킴의 가요광장": { homepage: KBS("paulgayo") },
  "가비의 슈퍼라디오": { homepage: KBS("gabeesuperradio") },
  "윤정수 남창희의 미스터 라디오": { homepage: KBS("misterradio") },
  "오마이걸 효정의 볼륨을 높여요": { homepage: KBS("hyojung_volume") },
  "한해의 키스더라디오": { homepage: KBS("hanhaekiss") },

  // ── MBC FM4U ────────────────────────────────────
  "세상을 여는 아침, 이영은입니다": {
    homepage: MBC("worldmorning"),
    corners: [
      c([월], "세아침 반짝뉴스"),
      c([화], "그 달의 노래"),
      c([수], "퀴즈, 도망자들"),
      c([목], "평일의 발견"),
      c([금], "배틀! 착플리스"),
      c([토], "세아침 빵글뮤직"),
      c([일], "클래식한 라디오"),
    ],
  },
  "굿모닝 FM 테이입니다": {
    homepage: MBC("morning-fm"),
    corners: [
      c([월], "유행본부"),
      c([화], "테이네 빨간 책방"),
      c([수], "맛쟁이 신사"),
      c([목], "아침에 깨워서 미안하지만"),
      c([금], "미라클 머니"),
      c([금], "브랜드랜드"),
      c([토, 일], "관계의 기술"),
      c([토, 일], "관중석 1열"),
      c([토], "깨어난 김에 역사일주"),
      c([일], "굿모닝 뮤직"),
    ],
  },
  "정오의 희망곡 김신영입니다": {
    homepage: MBC("musicparty"),
    corners: [
      c([화], "Live On Air"),
      c([수], "선생님을 모십니다"),
      c([목], "미우미움"),
      c([목], "니맘내맘"),
      c([금], "노뮤직 노라이프"),
      c([토], "추억의 TOP 10"),
      c([일], "정오의희망곡 TOP 15"),
    ],
  },
  "두시의 데이트 안영미입니다": {
    homepage: MBC("date"),
    corners: [
      c([월], "셀럽을 만나고 싶어"),
      c([화], "노중훈의 노계획 노다지"),
      c([수], "두데가 쏘아올린 뮤직 두.쏘.뮤"),
      c([목], "나의 X 이야기"),
      c([금], "나의 옛날 이야기"),
      c([토], "두 대통합 차트"),
    ],
  },
  "김이나의 별이 빛나는 밤에": {
    homepage: MBC("starnight"),
    corners: [
      c([월], "절찬리 상영중"),
      c([화], "별밤 초대석"),
      c([수], "영업합니다 시즌4"),
      c([목], "별밤 콘서트 in Studio"),
      c([금], "우리가 함께 사랑을 읽을 수도 있겠습니다"),
      c([토], "노래에 기대는 밤"),
      c([일], "영화가 빛나는 밤 / 그림이 빛나는 밤"),
    ],
  },
  "제로베이스원의 친한친구": {
    homepage: MBC("bfever"),
    corners: [
      c([월], "태래방"),
      c([화], "이 밤의 헤드라이너"),
      c([수], "취향.zip"),
    ],
  },
  "IDOL RADIO 시즌4": { homepage: MBC("idolradio") },
  // 스포왕 고영배 — 홈페이지 주소를 확인하지 못했다

  // ── MBC 표준FM ──────────────────────────────────
  "오늘도 당신 편 이재은입니다": {
    homepage: MBC("today_fm"),
    corners: [
      c([월], "요즘 우리는"),
      c([화], "오늘만 남의 편"),
      c([수], "내 마음 보고서"),
      c([목], "오당재 초대석"),
      c([금], "주말엔 산으로"),
      c([토], "모여라! 우리 동호회"),
      c([토], "지구를 위한 실천"),
      c([토], "오슐랭 가이드"),
      c([일], "희곡이 들린다"),
      c([일], "뻔한 노래"),
    ],
  },
};

/** 그 프로그램의 그 요일(0=일) 코너 이름들. 없으면 빈 배열 */
export function cornersOn(program: string, day: number): string[] {
  return (RADIO_PROGRAM_INFO[program]?.corners ?? [])
    .filter((corner) => corner.days.includes(day))
    .map((corner) => corner.name);
}
