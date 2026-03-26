"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconBallFootball, IconBrandGithub, IconBrandGoogle, IconLock, IconMail } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    }
  }, [searchParams]);

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email"),
      password: (v) => (v.length > 0 ? null : "Password is required"),
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error } = await login(values.email, values.password);
    setLoading(false);

    if (error) {
      notifications.show({ color: "red", title: "Login failed", message: error });
      return;
    }

    notifications.show({ color: "green", title: "Welcome back!", message: "You have successfully logged in." });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <Box w="100%" maw={440}>
        <Center mb="xl">
          <Stack align="center" gap="xs">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 shadow-lg shadow-blue-500/40">
              <IconBallFootball size={36} color="white" />
            </div>
            <Title order={1} className="text-white tracking-tight" size="h2">
              SportsDeck
            </Title>
            <Text size="sm" c="dimmed">
              The Ultimate Hub for Sports Fans
            </Text>
          </Stack>
        </Center>

        <Paper radius="lg" p="xl" withBorder className="bg-white/5 border-white/10 backdrop-blur-sm">
          <Title order={2} mb={4} size="h3" className="text-white">
            Sign in
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Don&apos;t have an account?{" "}
            <Anchor component={Link} href="/signup" size="sm" c="blue.4">
              Create one
            </Anchor>
          </Text>

          <Stack gap="sm" mb="lg">
            <Button
              component="a"
              href="/api/auth/oauth/github"
              variant="default"
              fullWidth
              leftSection={<IconBrandGithub size={18} />}
              className="border-white/20 hover:bg-white/10 text-white transition-colors"
            >
              Continue with GitHub
            </Button>
            <Button
              component="a"
              href="/api/auth/oauth/google"
              variant="default"
              fullWidth
              leftSection={<IconBrandGoogle size={18} />}
              className="border-white/20 hover:bg-white/10 text-white transition-colors"
            >
              Continue with Google
            </Button>
          </Stack>

          <Divider label="or sign in with email" labelPosition="center" mb="lg" />

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                leftSection={<IconMail size={16} />}
                styles={{ label: { color: "var(--mantine-color-gray-3)" } }}
                {...form.getInputProps("email")}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                leftSection={<IconLock size={16} />}
                styles={{ label: { color: "var(--mantine-color-gray-3)" } }}
                {...form.getInputProps("password")}
              />
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                mt="xs"
                className="bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>

        <Group justify="center" mt="md">
          <Text size="xs" c="dimmed">
            New to SportsDeck?{" "}
            <Anchor component={Link} href="/signup" size="xs" c="blue.4">
              Sign up for free
            </Anchor>
          </Text>
        </Group>
      </Box>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Loader color="blue" size="lg" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}
