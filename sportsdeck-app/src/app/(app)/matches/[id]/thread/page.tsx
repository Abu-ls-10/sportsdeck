"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MatchThreadRedirectPage() {
  const router = useRouter();
  const params = useParams();

  const matchId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!matchId) return;

    async function load() {
      try {
        const res = await fetch(`/api/matches/${matchId}/thread`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch match thread");
        }

        const data = await res.json();

        const threadId = data?.thread?.id;

        if (!threadId) {
          throw new Error("Thread not found");
        }

        router.replace(`/threads/${threadId}`);
      } catch (err) {
        console.error(err);
        router.replace("/matches");
      }
    }

    load();
  }, [matchId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-text-secondary">
      <Loader2 className="animate-spin h-6 w-6" />
      <p>Loading match discussion...</p>
    </div>
  );
}