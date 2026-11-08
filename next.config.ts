import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
     * 최적화 결과를 1년 캐시한다.
     *
     * Vercel 은 캐시가 만료된 뒤 같은 이미지를 다시 변환하면 **변환 횟수를 또 센다.**
     * Next 16 의 기본값은 4시간이라 한 장이 하루에 여섯 번까지 재변환될 수 있고,
     * 소스가 85장쯤(노션 가이드 49 · 배너 3 · 아이콘 29 · 라디오 3 · 프로필 1) 되는
     * 지금 규모에서 이게 2026-11 이미지 최적화 한도 초과의 직접 원인이었다.
     *
     * ⚠ 로컬 파일을 **같은 이름으로** 교체하면 최대 1년간 옛 이미지가 남는다.
     *   교체할 때는 파일명을 바꾼다. 노션 이미지는 프록시 주소에 `v` 토큰이 붙어
     *   있어서(lib/notion-image.ts) 내용이 바뀌면 주소가 함께 바뀐다 — 안전하다.
     */
    minimumCacheTTL: 31536000,
    /*
     * 변환 폭을 4단계로 줄인다 (기본값은 640~3840 의 8단계).
     * 소스 한 장이 만드는 변환 수가 곧 과금 단위이고, 팬덤의 90% 이상이 모바일이라
     * 2048 · 3840 은 값에 비해 거의 쓰이지 않는다.
     */
    deviceSizes: [640, 750, 1080, 1920],
    /*
     * 로컬 이미지 허용 목록.
     *
     * Next 16 은 src 에 쿼리스트링이 붙은 로컬 이미지를 여기 등록하지 않으면
     * 렌더 단계에서 에러를 던진다(페이지가 통째로 500 이 된다).
     * 가이드 이미지는 /api/guide-image?p=…&i=…&v=… 형태라 이 설정이 필요하다.
     *
     * ⚠ localPatterns 를 한 번이라도 지정하면 "모든" 로컬 이미지가 이 목록을
     *   통과해야 한다. public/icons/*.png 까지 덮도록 첫 항목을 둔 이유다.
     */
    localPatterns: [
      // 쿼리스트링 없는 일반 로컬 이미지 (public/icons, 프로필 사진 등)
      { pathname: "/**", search: "" },
      // 노션 이미지 프록시 — 쿼리스트링이 이미지마다 다르므로 search 를 비워
      // 둔다(생략 = 모든 쿼리 허용). 경로는 이 두 라우트로 좁혀 둔다.
      { pathname: "/api/guide-image" },
      { pathname: "/api/banner-image" },
    ],
    // 가이드 이미지는 노션에 있지만 위 프록시(동일 출처)로 서빙되므로
    // 노션 · S3 호스트를 여기 추가할 필요가 없다. 아래는 그 외 외부 이미지용.
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  /*
   * 정적 이미지에 1년 immutable 캐시를 물린다.
   *
   * public/ 파일은 기본값이 `max-age=0, must-revalidate` 라, 한 번 받아 둔 로고 ·
   * 아이콘을 방문마다 다시 확인한다(304 라도 왕복은 왕복이다). /_next/static 처럼
   * 영구 캐시로 돌리려면 주소가 내용에 따라 달라져야 하고, 그래서 이 디렉터리의
   * 파일 이름에는 버전 꼬리표가 붙어 있다 (`melon_2611.png`).
   *
   * ⚠ 그 꼬리표가 이 헤더의 전제다. **같은 이름으로 파일을 덮으면 최대 1년간
   *   옛 이미지가 남는다.** 파일을 바꿀 때는 꼬리표를 올린 새 이름으로 넣고 옛
   *   파일을 지운다. /icons 는 그 연결을 lib/icon-manifest.ts 가 자동으로 잡아
   *   주지만(scripts/gen-icon-manifest.mjs), /profile · /radio · 로고는 참조가
   *   한 곳뿐이라 호출부의 문자열을 함께 고쳐야 한다.
   */
  async headers() {
    const immutable = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/icons/:file*", headers: immutable },
      { source: "/profile/:file*", headers: immutable },
      { source: "/radio/:file*", headers: immutable },
      { source: "/drstrm_logo_2611.png", headers: immutable },
    ];
  },
};

/*
 * next-intl 플러그인. i18n/request.ts (기본 경로)를 빌드에 엮어서
 * 서버 컴포넌트가 요청마다 알맞은 메시지를 받게 한다.
 */
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
