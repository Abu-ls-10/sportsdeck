"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_AVATAR_URL } from "@/lib/avatar";

export type UserAvatarProps = {
  username?: string | null;
  avatarUrl?: string | null;
  href?: string;
  title?: string;
  sizeClass?: string;
};

/**
 * Circular avatar: remote image when available, otherwise default silhouette.
 * Optional link wrapper (e.g. to profile). Falls back to initial on image error.
 */
export function UserAvatar({
  username,
  avatarUrl,
  href,
  title = "View profile",
  sizeClass = "h-9 w-9",
}: UserAvatarProps) {
  const [failedUserImage, setFailedUserImage] = useState(false);
  const [failedFallbackImage, setFailedFallbackImage] = useState(false);
  const initial = username?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    setFailedUserImage(false);
    setFailedFallbackImage(false);
  }, [avatarUrl]);
  const trimmed = avatarUrl?.trim() ?? "";
  const userSrc = trimmed && !failedUserImage ? trimmed : null;
  const displaySrc = userSrc ?? DEFAULT_AVATAR_URL;

  const inner = (
    <span
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-elevated shadow-glow transition-all duration-200 hover:scale-105 hover:shadow-glow`}
    >
      {!failedFallbackImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displaySrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            if (userSrc) setFailedUserImage(true);
            else setFailedFallbackImage(true);
          }}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-primary text-sm font-semibold text-primary">
          {initial}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={title}
        className="shrink-0 outline-none ring-offset-2 ring-offset-bg-surface focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
