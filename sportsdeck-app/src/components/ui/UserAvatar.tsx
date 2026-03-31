"use client";

import Link from "next/link";
import { useState } from "react";

export function UserAvatar({
  username,
  avatarUrl,
  href,
  title,
  sizeClass = "h-9 w-9",
}: {
  username: string | null;
  avatarUrl: string | null;
  href?: string;
  title?: string;
  sizeClass?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const initial = username?.[0]?.toUpperCase() ?? "U";
  const showImage = avatarUrl && !imgError;

  const content = showImage ? (
    <img
      src={avatarUrl}
      alt={username ?? "User"}
      className={`${sizeClass} rounded-full object-cover`}
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      className={`
        ${sizeClass}
        rounded-full
        bg-gradient-primary
        flex items-center justify-center
        text-white text-sm font-semibold
        shadow-glow
      `}
    >
      {initial}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={title}
        className="hover:scale-105 transition-all duration-200"
      >
        {content}
      </Link>
    );
  }

  return content;
}