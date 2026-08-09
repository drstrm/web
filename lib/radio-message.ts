/*
 * 라디오 사연 문자 자동 생성 (서버 전용)
 * ------------------------------------------------------------------
 * 지금이 언제인지(평일 · 주말 × 아침 · 점심 · 오후 · 저녁 · 밤)와 지금 방송 중인
 * 프로그램의 DJ 호칭을 조합해, 매번 다른 사연 문장을 하나 뽑아준다.
 *
 * 문장 안의 자리표시자는 두 종류다.
 *   ${dj_name}            → DJ 호칭 ("완디", "철업디" …)
 *   ${은는} ${이가} ${을를}  → 앞 호칭의 받침에 맞는 조사
 * DJ 가 없는 시간대(음악 방송 · 편성 공백)에는 호칭과 조사를 통째로 지운다.
 */

import { kstNow } from "@/lib/datetime";
import { dayTypeOf, type RadioSlot } from "@/lib/radio";

type TimeSlot = "morning" | "lunch" | "afternoon" | "evening" | "night";

type SentencePool = Record<TimeSlot, string[]>;

const SENTENCES: {
  weekday: SentencePool;
  weekend: SentencePool;
  /** 시간대를 타지 않는 문장. 항상 후보에 섞인다 */
  all: string[];
} = {
  weekday: {
    morning: [
      "${dj_name}~ 출근길 잠 깨우는 노래가 필요해서요. 아침 텐션 확 올려줄 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 오늘 하루 시작을 힘차게 하고 싶어요. 듣자마자 기분 좋아지는 NCT DREAM의 Beat It Up 틀어주세요!",
      "아침부터 발걸음 빨라지는 노래가 생각나서 신청해요. ${dj_name} 라디오에서 NCT DREAM의 Beat It Up 들으면 딱 좋을 것 같아요!",
      "${dj_name}~ 졸린 아침에 에너지 충전하고 싶어요. 상쾌하게 깨워줄 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 커피보다 먼저 라디오 켰어요. 오늘 첫 응원송으로 NCT DREAM의 Beat It Up 부탁드려요!",
      "출근 준비하면서 듣고 싶은 곡이 생겼어요. ${dj_name} 오늘 아침 분위기에 NCT DREAM의 Beat It Up 꼭 들려주세요!",
    ],
    lunch: [
      "${dj_name}~ 점심 먹고 다시 힘내야 하는 시간이에요. 오후 시작 전에 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 밥 먹고 나니까 조금 나른한데요. 텐션 다시 올려줄 NCT DREAM의 Beat It Up 들려주세요!",
      "점심시간 끝나기 전에 신나는 노래 하나 듣고 싶어요. ${dj_name} NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}~ 오늘 점심 메뉴도 좋았는데, 여기에 NCT DREAM의 Beat It Up까지 나오면 완벽할 것 같아요!",
      "${dj_name}! 오후도 잘 버틸 수 있게 에너지 넘치는 NCT DREAM의 Beat It Up 부탁드려요!",
      "짧은 점심 휴식이지만 라디오 덕분에 기분 전환 중이에요. NCT DREAM의 Beat It Up 신청합니다!",
    ],
    afternoon: [
      "${dj_name}~ 오후 집중력이 떨어질 때라 신나는 곡이 필요해요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 이 시간만 되면 졸음이 오는데 NCT DREAM의 Beat It Up 나오면 바로 깨어날 것 같아요!",
      "오후 업무 BGM으로 딱 어울리는 곡 신청해요. ${dj_name} NCT DREAM의 Beat It Up 들려주세요!",
      "${dj_name}~ 커피 한 잔보다 더 확실한 에너지가 필요해서 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 남은 오후도 기분 좋게 달릴 수 있게 NCT DREAM의 Beat It Up 부탁드려요!",
      "퇴근까지 아직 조금 남았지만 이 노래 들으면 힘날 것 같아요. NCT DREAM의 Beat It Up 신청합니다!",
    ],
    evening: [
      "${dj_name}~ 퇴근길에 하루 피로 털어낼 노래가 필요해요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 오늘도 수고한 기분으로 라디오 듣고 있어요. 신나게 마무리하게 NCT DREAM의 Beat It Up 틀어주세요!",
      "집에 가는 길에 에너지 충전하고 싶어요. ${dj_name} NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}~ 저녁 공기랑 신나는 비트가 잘 어울릴 것 같아서 NCT DREAM의 Beat It Up 부탁드려요!",
      "${dj_name}! 하루 끝에 기분 전환 제대로 하고 싶어요. NCT DREAM의 Beat It Up 들려주세요!",
      "퇴근 후에도 기운 남겨두고 싶어서 신청합니다. NCT DREAM의 Beat It Up 라디오에서 듣고 싶어요!",
    ],
    night: [    
      "${dj_name}! 하루 마무리하면서 기분 좋은 곡 듣고 싶어요. NCT DREAM의 Beat It Up 틀어주세요!",
      "밤 산책하면서 라디오 듣는 중이에요. ${dj_name} NCT DREAM의 Beat It Up 나오면 발걸음이 더 가벼워질 것 같아요!",
      "${dj_name}~ 오늘 마지막 신청곡으로 NCT DREAM의 Beat It Up 보내봅니다. 꼭 들려주세요!",
      "${dj_name}! 잠들기 전까지 기분 좋게 있고 싶어서 NCT DREAM의 Beat It Up 신청합니다!",
      "늦은 시간에도 신나는 노래가 당기네요. NCT DREAM의 Beat It Up 부탁드려요!",
    ],
  },
  weekend: {
    morning: [
      "${dj_name}~ 주말 아침을 신나게 열고 싶어요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 늦잠 후 라디오 켰는데 기분 확 올려줄 곡이 듣고 싶어요. NCT DREAM의 Beat It Up 부탁드려요!",
      "주말 시작부터 에너지 넘치게 가고 싶어서 신청해요. ${dj_name} NCT DREAM의 Beat It Up 들려주세요!",
      "${dj_name}~ 산책 나가는 길에 듣고 싶은 곡이에요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 여유로운 주말 아침에도 신나는 노래는 필요하죠. NCT DREAM의 Beat It Up 틀어주세요!",
    ],
    lunch: [
      "${dj_name}~ 주말 점심 먹고 기분 좋게 쉬는 중이에요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 친구랑 라디오 듣다가 같이 신청해요. NCT DREAM의 Beat It Up 들려주세요!",
      "맛있는 점심에 신나는 노래까지 더하고 싶어요. ${dj_name} NCT DREAM의 Beat It Up 부탁드려요!",
      "${dj_name}~ 주말 외출길 BGM으로 딱일 것 같아서 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 오늘 분위기를 더 신나게 만들어줄 NCT DREAM의 Beat It Up 틀어주세요!",
    ],
    afternoon: [
      "${dj_name}~ 주말 오후 드라이브하면서 듣고 싶은 곡이에요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 카페에서 쉬다가 라디오 듣고 있어요. 분위기 전환으로 NCT DREAM의 Beat It Up 부탁드려요!",
      "주말 오후가 더 즐거워질 노래 신청합니다. ${dj_name} NCT DREAM의 Beat It Up 들려주세요!",
      "${dj_name}~ 쇼핑하면서 들으면 발걸음이 더 가벼워질 것 같아요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 나른한 주말 오후를 깨워줄 NCT DREAM의 Beat It Up 틀어주세요!",
    ],
    evening: [
      "${dj_name}~ 주말 저녁 분위기 올리고 싶어서 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 맛있는 저녁 먹고 라디오 듣는 중이에요. NCT DREAM의 Beat It Up 나오면 더 신날 것 같아요!",
      "친구들이랑 같이 듣고 싶은 곡이에요. ${dj_name} NCT DREAM의 Beat It Up 들려주세요!",
      "${dj_name}~ 주말이 그냥 지나가기 아쉬워서 신나는 곡 하나 신청해요. NCT DREAM의 Beat It Up 부탁드려요!",
      "${dj_name}! 저녁 산책길에 듣고 싶어요. NCT DREAM의 Beat It Up 신청합니다!",
    ],
    night: [
      "${dj_name}~ 주말 밤 마지막까지 신나게 보내고 싶어요. NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 내일 생각은 잠깐 미뤄두고 기분 좋은 노래 듣고 싶어요. NCT DREAM의 Beat It Up 틀어주세요!",
      "주말 밤 라디오에서 꼭 듣고 싶은 곡이에요. ${dj_name} NCT DREAM의 Beat It Up 부탁드려요!",
      "${dj_name}~ 오늘 하루 마무리곡으로 NCT DREAM의 Beat It Up 신청합니다!",
      "${dj_name}! 밤에도 에너지 넘치는 NCT DREAM의 Beat It Up 들으면 주말이 더 완벽할 것 같아요!",
    ],
  },
  all: [
    "${dj_name}~ 요즘 계속 듣고 있는 곡이에요. 라디오에서도 NCT DREAM의 Beat It Up 꼭 듣고 싶어서 신청합니다!",
    "${dj_name}! 들을수록 기분 좋아지는 NCT DREAM의 Beat It Up 신청해요. 꼭 틀어주세요!",
    "오늘 라디오에서 NCT DREAM의 Beat It Up 나오면 정말 반가울 것 같아요. 신청합니다!",
    "${dj_name} 라디오 분위기랑 NCT DREAM의 Beat It Up이 잘 어울릴 것 같아서 신청해봅니다!",
    "${dj_name}${은는} 오늘 어떤 노래로 기분 전환하세요? 저는 NCT DREAM의 Beat It Up으로 에너지 충전하고 싶어요!",
    "신나는 비트가 필요한 순간이라 NCT DREAM의 Beat It Up 신청합니다. 라디오로 같이 듣고 싶어요!",
    "${dj_name}~ NCT DREAM의 Beat It Up 들으면 바로 기분이 살아나요. 오늘 선곡으로 부탁드려요!",
    "같이 듣는 분들도 기분 좋아질 것 같아서 신청해요. NCT DREAM의 Beat It Up 틀어주세요!",
    "${dj_name}! 오늘의 신청곡은 NCT DREAM의 Beat It Up입니다. 라디오에서 크게 듣고 싶어요!",
    "플레이리스트에서 계속 반복 중인 곡인데 라디오로 들으면 더 좋을 것 같아요. NCT DREAM의 Beat It Up 신청합니다!",
  ],
};

/** 받침이 있으면 앞, 없으면 뒤 */
const JOSA: Record<string, [string, string]> = {
  은는: ["은", "는"],
  이가: ["이", "가"],
  을를: ["을", "를"],
};

/** 한글 음절이면 받침 유무로, 아니면 받침이 없는 것으로 본다 */
function hasBatchim(name: string): boolean {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function timeSlotOf(hour: number): TimeSlot {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 지금 시간대 · 지금 방송 중인 프로그램에 맞는 사연 문자 한 통.
 * slot 이 null 이면(편성 공백 · 편성표 없는 채널) 호칭 없는 문장이 나온다.
 */
export function buildRadioMessage(
  slot: RadioSlot | null,
  now: Date = new Date()
): string {
  const { day, hour } = kstNow(now);
  const dayType = dayTypeOf(day);
  const group = dayType === "weekday" ? "weekday" : "weekend";

  const sentence = pickRandom([
    ...SENTENCES[group][timeSlotOf(hour)],
    ...SENTENCES.all,
  ]);

  const dj = slot?.djName ?? null;
  if (!dj) {
    // 호칭이 없으면 뒤따르는 조사와 호격의 여운(~, !, 공백)까지 같이 지운다.
    return sentence
      .replace(/\$\{dj_name\}\$\{[^}]+\}[~!\s]*/g, "")
      .replace(/\$\{dj_name\}[~!\s]*/g, "")
      .trim();
  }

  const batchim = hasBatchim(dj);
  return sentence.replace(/\$\{(dj_name|은는|이가|을를)\}/g, (_, key: string) =>
    key === "dj_name" ? dj : JOSA[key][batchim ? 0 : 1]
  );
}
