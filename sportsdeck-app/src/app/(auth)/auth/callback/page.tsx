"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function OAuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshAccessToken } = useAuth();

  useEffect(() => {
    const access_token = searchParams.get("access_token");
    const refresh_token = searchParams.get("refresh_token");
    const error = searchParams.get("error");

    if (error) {
      const messages: Record<string, string> = {
        oauth_cancelled: "Sign-in was cancelled.",
        oauth_failed: "OAuth sign-in failed. Please try again.",
        no_email: "Could not retrieve your email from the provider.",
      };

      // TODO: Replace with global toast system later
      alert(messages[error] ?? "Something went wrong.");

      router.replace("/login");
      return;
    }

    if (!access_token || !refresh_token) {
      router.replace("/login");
      return;
    }

    localStorage.setItem("refresh_token", refresh_token);

    refreshAccessToken().then(() => {
      // TODO: Replace with toast
      router.replace("/");
    });
  }, [searchParams, router, refreshAccessToken]);

  return <CallbackUI text="Completing sign-in…" />;
}

function CallbackFallback() {
  return <CallbackUI text="Loading…" />;
}

/**
 * Reusable UI component
 * - Glass card
 * - Glow background
 * - Custom loader
 */
function CallbackUI({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative overflow-hidden">
      
      {/* Glow Background */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

      {/* Center Card */}
      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-card backdrop-blur-xs p-8 text-center">
          
          {/* Loader */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>

          {/* Text */}
          <p className="text-sm text-text-secondary">
            {text}
          </p>

        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <OAuthCallbackInner />
    </Suspense>
  );
}