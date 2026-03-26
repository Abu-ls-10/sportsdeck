"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
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
      notifications.show({
        color: "red",
        title: "Sign-in failed",
        message: messages[error] ?? "Something went wrong.",
      });
      router.replace("/login");
      return;
    }

    if (!access_token || !refresh_token) {
      router.replace("/login");
      return;
    }

    localStorage.setItem("refresh_token", refresh_token);
    refreshAccessToken().then(() => {
      notifications.show({
        color: "green",
        title: "Signed in!",
        message: "Welcome to SportsDeck.",
      });
      router.replace("/");
    });
  }, [searchParams, router, refreshAccessToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Center>
        <Stack align="center" gap="md">
          <Loader color="blue" size="lg" />
          <Text c="dimmed" size="sm">
            Completing sign-in…
          </Text>
        </Stack>
      </Center>
    </div>
  );
}

function CallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Center>
        <Stack align="center" gap="md">
          <Loader color="blue" size="lg" />
          <Text c="dimmed" size="sm">
            Loading…
          </Text>
        </Stack>
      </Center>
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
