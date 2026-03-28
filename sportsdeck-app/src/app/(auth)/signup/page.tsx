"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  Group,
  List,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconBallFootball,
  IconBrandGithub,
  IconBrandGoogle,
  IconCheck,
  IconLock,
  IconMail,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function passwordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: "", password: "", confirmPassword: "" },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email"),
      password: (v) => passwordStrength(v),
      confirmPassword: (v, values) =>
        v === values.password ? null : "Passwords do not match",
    },
  });

  const handleSubmit = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    const { error } = await signup(values.email, values.password);
    setLoading(false);

    if (error) {
      notifications.show({ color: "red", title: "Sign up failed", message: error });
      return;
    }

    notifications.show({
      color: "green",
      title: "Account created!",
      message: "Welcome to SportsDeck. Let's set up your profile.",
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <Box w="100%" maw={460}>
        {/* Brand */}
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
            Create your account
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Already have an account?{" "}
            <Anchor component={Link} href="/login" size="sm" c="blue.4">
              Sign in
            </Anchor>
          </Text>

          {/* OAuth buttons */}
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

          <Divider label="or sign up with email" labelPosition="center" mb="lg" />

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
                placeholder="At least 8 characters"
                leftSection={<IconLock size={16} />}
                styles={{ label: { color: "var(--mantine-color-gray-3)" } }}
                {...form.getInputProps("password")}
              />
              <PasswordInput
                label="Confirm password"
                placeholder="Repeat your password"
                leftSection={<IconLock size={16} />}
                styles={{ label: { color: "var(--mantine-color-gray-3)" } }}
                {...form.getInputProps("confirmPassword")}
              />
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                mt="xs"
                className="bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Create account
              </Button>
            </Stack>
          </form>

          <Divider my="lg" />

          <List
            spacing={4}
            size="xs"
            c="dimmed"
            icon={
              <ThemeIcon color="blue" size={16} radius="xl">
                <IconCheck size={10} />
              </ThemeIcon>
            }
          >
            <List.Item>Join discussions on your favourite matches</List.Item>
            <List.Item>Follow other fans and get a personalised feed</List.Item>
            <List.Item>Create polls, vote, and share your opinions</List.Item>
          </List>
        </Paper>

        <Group justify="center" mt="md">
          <Text size="xs" c="dimmed">
            Already a member?{" "}
            <Anchor component={Link} href="/login" size="xs" c="blue.4">
              Sign in here
            </Anchor>
          </Text>
        </Group>
      </Box>
    </div>
  );
}
