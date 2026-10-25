/*
 * 라이트 · 다크 테마
 * ------------------------------------------------------------------
 * 색 자체는 app/globals.css 가 전부 갖고 있다. 이 파일은 「지금 어느 테마인가」를
 * 저장하고 꺼내는 규칙만 정한다.
 *
 * 상태는 세 가지다.
 *   · 저장값 없음 → 시스템 설정(prefers-color-scheme)을 따른다. 기본값
 *   · "light"     → html[data-theme="light"] 로 라이트 고정
 *   · "dark"      → html[data-theme="dark"]  로 다크 고정
 *
 * 토글이 시스템 설정과 같은 쪽으로 돌아오면 저장값을 지운다 — 그래야 「시스템
 * 따라가기」로 돌아갈 길이 버튼 하나로 남는다.
 */

export type Theme = "light" | "dark";

/** localStorage 키. app/layout.tsx 의 선적용 스크립트도 이 값을 쓴다 */
export const THEME_KEY = "drstrm-theme";

/** 모바일 주소창 색 (globals.css 의 --background 와 같은 값) */
export const THEME_COLOR: Record<Theme, string> = {
  light: "#f6fbff",
  dark: "#070d16",
};

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * 첫 페인트 전에 돌아야 하는 스크립트.
 *
 * CSS 만으로도 시스템 설정은 따라가지만, 「라이트 고정」을 골라 둔 사용자가
 * 다크 시스템에서 들어오면 data-theme 이 붙기 전까지 한 프레임 동안 다크가
 * 번쩍인다. <head> 에서 동기로 실행해 그 깜빡임을 없앤다.
 *
 * 저장값이 없으면 아무것도 하지 않는다 — 그대로 CSS 의 미디어 쿼리에 맡긴다.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
