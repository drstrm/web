import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
};

export default nextConfig;
