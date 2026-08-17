"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type LoadingImageProps = ImageProps & {
  wrapperClassName?: string;
  loadingLabel?: string;
};

export default function LoadingImage({
  src,
  ...props
}: LoadingImageProps) {
  return (
    <LoadingImageWithState
      key={typeof src === "string" ? src : undefined}
      src={src}
      {...props}
    />
  );
}

function LoadingImageWithState({
  wrapperClassName = "",
  loadingLabel = "이미지 불러오는 중",
  className = "",
  alt,
  onLoad,
  onError,
  src,
  ...props
}: LoadingImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const busy = !loaded && !failed;
  const wrapperPosition = props.fill ? "absolute inset-0" : "relative";

  return (
    <div
      className={`${wrapperPosition} overflow-hidden ${wrapperClassName}`}
      aria-busy={busy || undefined}
    >
      {busy && (
        <div
          role="status"
          aria-label={loadingLabel}
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-sky-100"
        >
          <span className="image-loading-bar block h-full w-2/3 rounded-full bg-sky-500" />
        </div>
      )}
      <Image
        {...props}
        src={src}
        alt={alt}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
        className={`${className} transition-opacity duration-200 ${
          loaded || failed ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
