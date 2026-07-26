import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // A안: 가이드 이미지는 Vercel Blob / Cloudinary 등 외부 호스팅 권장
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
