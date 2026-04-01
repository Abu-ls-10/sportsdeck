"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  subtitle?: string;
  userId?: string;
  isFollowing?: boolean;
};

export default function ThreadsHero({
  title,
  subtitle,
  userId,
  isFollowing = false,
}: Props) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/follow/${userId}`, {
        method: following ? "DELETE" : "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update follow");
      }

      setFollowing(!following);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/6 bg-bg-surface px-4 py-4 shadow-card md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400/15 ring-1 ring-accent-400/20">
            <div className="h-7 w-7 rounded-full bg-accent-400" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-primary md:text-2xl">
              {title}
            </h1>

            {subtitle && (
              <div className="mt-1 text-xs text-text-muted">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          
          {/* Notifications */}
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-text-secondary transition hover:bg-white/[0.06] hover:text-primary">
            <Bell className="h-4 w-4" />
          </button>

          {/* Follow Button */}
          {userId && (
            <button
              onClick={handleFollow}
              disabled={loading}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                following
                  ? "border border-white/10 bg-white/[0.05] text-primary hover:bg-white/[0.08]"
                  : "bg-gradient-primary text-primary shadow-glow hover:brightness-110"
              } disabled:opacity-50`}
            >
              {loading
                ? "..."
                : following
                ? "Following"
                : "Follow"}
            </button>
          )}

        </div>
      </div>
    </section>
  );
}