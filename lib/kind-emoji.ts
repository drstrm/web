/*
 * 노션 일정 DB 의 `종류` 별 기본 이모지.
 * `emoji` 열 값이 있으면 그쪽이 우선하고, public/icons 아이콘이
 * 있으면 아이콘이 이모지를 대체한다(PlatformIcon 의 fallback 인자).
 */

export const KIND_EMOJI: Record<string, string> = {
  debut: "💚",
  birthday: "🎂",
  comeback: "💿",
  vote: "🗳️",
  chart: "📊",
  broadcast: "📺",
  streaming: "🎧",
  etc: "📌",
};

export const emojiOf = (kind: string, emoji?: string) =>
  emoji ?? KIND_EMOJI[kind] ?? "📌";
