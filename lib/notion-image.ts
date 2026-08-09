/*
 * 노션 이미지 프록시 공통 처리
 * ------------------------------------------------------------------
 * GET /api/<가이드 | 배너>-image?p=<노션 page id>&i=<이미지 순번>&v=<버전 토큰>
 *
 * 노션이 주는 S3 URL 은 X-Amz-Expires=3600 (1시간) 짜리 서명 URL 이다.
 * 그 주소를 HTML 에 그대로 박으면, 캐시된 페이지를 한 시간 뒤에 연 사용자에게는
 * 이미지가 전부 403 으로 깨진다. 그래서 서명 URL 은 서버에만 두고,
 * 브라우저에는 이 라우트의 주소만 노출한다.
 *
 * `v` 는 원본 파일이 바뀔 때만 값이 변하는 토큰(lib/notion.ts 참고)이라,
 * 응답을 사실상 영구 캐시해도 안전하다. 운영진이 노션에서 이미지를 교체하면
 * `v` 가 바뀌면서 새 URL 이 되고, 캐시를 우회해 곧바로 새 이미지가 나간다.
 *
 * 캐시가 살아 있는 동안에는 이 핸들러가 아예 실행되지 않으므로,
 * 노션 API 호출도 원본 전송량도 이미지당 사실상 1회로 끝난다.
 *
 * DB 마다 라우트를 따로 두고 `resolve` 만 갈아 끼운다. 한 라우트가 여러 DB 를
 * 받게 하면 "어느 DB 의 페이지인지"를 요청자가 고르게 되므로, 프록시가 스스로
 * 데이터 소스를 검사하는 의미(lib/notion.ts)가 옅어진다.
 */

import type { NotionFileSource } from "@/lib/notion";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function serveNotionImage(
  req: Request,
  opts: {
    /** 로그 태그 (`[guide-image] …`) */
    tag: string;
    /** page id · 순번 → 원본 서명 URL. 다른 DB 의 페이지면 null 을 준다. */
    resolve: (pageId: string, index: number) => Promise<NotionFileSource | null>;
  },
): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("p");
  const index = Number(searchParams.get("i") ?? "0");
  const version = searchParams.get("v");

  if (!pageId || !Number.isInteger(index) || index < 0) {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }

  let source: NotionFileSource | null;
  try {
    source = await opts.resolve(pageId, index);
  } catch (e) {
    console.error(`[${opts.tag}] 노션 조회 실패 (p=${pageId}, i=${index}):`, e);
    return new Response("이미지를 불러오지 못했습니다.", { status: 502 });
  }

  // 없는 행 · 없는 순번이거나, 해당 DB 밖의 페이지를 가리킨 경우
  if (!source) {
    return new Response("이미지를 찾을 수 없습니다.", { status: 404 });
  }

  const upstream = await fetch(source.url);
  if (!upstream.ok || !upstream.body) {
    // 서명 URL 을 방금 받았는데도 실패했다면 원본 쪽 문제다.
    console.error(`[${opts.tag}] 원본 응답 ${upstream.status} (p=${pageId})`);
    return new Response("이미지를 불러오지 못했습니다.", { status: 502 });
  }

  const length = upstream.headers.get("content-length");

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      ...(length ? { "Content-Length": length } : {}),
      // inline 이라 표시는 그대로 되고, 라이트박스의 다운로드 버튼(<a download>)이
      // 이 이름을 파일명으로 쓴다. 없으면 "guide-image" 로 저장돼 버린다.
      "Content-Disposition":
        `inline; filename*=UTF-8''${encodeURIComponent(source.name)}`,
      // v 가 붙은 주소만 영구 캐시한다. v 없이 들어온 요청까지 1년을 물리면
      // 그 주소에 옛 이미지가 박제된다.
      "Cache-Control": version
        ? `public, max-age=${ONE_YEAR}, immutable`
        : "public, max-age=300",
    },
  });
}
