/*
 * URL 보정 · 분류 (사이트 전역 공용)
 * ------------------------------------------------------------------
 * 화면에 링크를 걸기 전에 주소를 한 번 통과시키는 곳이다. 노션처럼
 * **사람이 손으로 적는 곳**에서 온 주소가 href 로 바로 들어가면 조용히 깨진다.
 *
 *  1) 스킴이 없는 주소 — `tinyurl.com/xxxx` 를 그대로 넣으면 브라우저가 상대경로로
 *     읽어 `/oneclick/streaming/tinyurl.com/xxxx` 라는 사이트 안 404 로 간다.
 *     실제로 스밍리스트 DB 는 링크 20 개 중 15 개가 이 형태다. 노션 표가 `https://`
 *     를 접어서 보여주기 때문에 「안 붙이는 게 맞나 보다」라고 읽히는 탓이 크다.
 *  2) http(s) 가 아닌 스킴 — `javascript:` 가 href 에 들어가면 클릭 시 그대로
 *     실행된다. 링크 칸을 만질 수 있는 사람이 늘어날수록 「언젠가」의 문제가 된다.
 *  3) 내부 경로와 외부 링크의 구분 — 새 탭으로 열지, 클라이언트 라우팅으로 갈지가
 *     여기서 갈린다. 화면마다 `startsWith("http")` 로 따로 판단하면 반드시 어긋난다.
 *
 * 렌더링까지 한 번에 처리하려면 이 파일을 직접 쓰지 말고 <SmartLink> 를 쓴다
 * (components/SmartLink.tsx). 이 파일은 서버에서 값을 걸러낼 때 쓴다.
 */

export type HrefKind =
  /** 사이트 안 (클라이언트 라우팅) */
  | "internal"
  /** 사이트 밖 (새 탭 + rel) */
  | "external"
  /** 기기 앱으로 넘김 (mailto: · sms: · tel:) — 새 탭으로 열면 빈 탭이 남는다 */
  | "app";

export interface ResolvedHref {
  /** href 에 그대로 넣을 수 있는 주소 */
  href: string;
  kind: HrefKind;
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const APP_SCHEMES = ["mailto:", "sms:", "tel:"];

/**
 * 주소 하나를 보정하고 분류한다. 쓸 수 없는 값이면 null.
 *
 * 같은 값을 두 번 넣어도 결과가 같다(멱등). 그래서 서버에서 한 번 보정해 저장해 둔
 * 값을 <SmartLink> 가 다시 통과시켜도 안전하다.
 */
export function resolveHref(raw?: string | null): ResolvedHref | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  // 같은 페이지 안 앵커 (`#preorder`)
  if (value.startsWith("#")) return { href: value, kind: "internal" };

  // 사이트 안 경로. `//evil.com` 은 프로토콜 상대 주소라 **생김새만** 내부 경로고
  // 실제로는 밖으로 나가므로 여기서 걸러 아래 외부 처리로 보낸다.
  if (value.startsWith("/") && !value.startsWith("//")) {
    return { href: value, kind: "internal" };
  }

  if (APP_SCHEMES.some((s) => value.toLowerCase().startsWith(s))) {
    return { href: value, kind: "app" };
  }

  let candidate: string;
  if (value.startsWith("//")) {
    candidate = `https:${value}`;
  } else if (SCHEME.test(value)) {
    candidate = value;
  } else {
    /*
     * 스킴이 없다. 도메인을 적은 것인지(`tinyurl.com/x`), 내부 경로에서 맨 앞
     * `/` 를 빠뜨린 것인지(`oneclick/voting`) 갈라야 한다.
     * 공개 도메인에는 반드시 점이 있으므로 첫 조각에 점이 없으면 경로로 본다 —
     * 여기서 https 를 붙이면 `https://oneclick/voting` 이라는 없는 주소가 된다.
     */
    const host = value.split(/[/?#]/, 1)[0];
    if (!host.includes(".")) return { href: `/${value}`, kind: "internal" };
    candidate = `https://${value}`;
  }

  try {
    const url = new URL(candidate);
    // http(s) 만 통과. javascript: · data: 등은 여기서 죽는다.
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { href: url.toString(), kind: "external" };
  } catch {
    return null;
  }
}

/** 보정된 주소만 필요할 때. 쓸 수 없는 값이면 null */
export const toHref = (raw?: string | null): string | null =>
  resolveHref(raw)?.href ?? null;
