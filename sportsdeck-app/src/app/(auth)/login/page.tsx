"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import OAuthButton from "@/components/auth/OAuthButton";

import { Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Logo from "@/components/ui/Logo";

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");

  const oauthErrorMsg = urlError
    ? {
        oauth_cancelled: "Sign-in was cancelled.",
        oauth_failed: "OAuth sign-in failed. Please try again.",
        no_email: "Could not retrieve your email.",
      }[urlError] ?? "Something went wrong."
    : null;

  const errorMsg = formError ?? oauthErrorMsg;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setFormError("Enter a valid email");
      return;
    }

    if (!password) {
      setFormError("Password is required");
      return;
    }

    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);

    if (error) {
      setFormError(error);
      return;
    }

    router.push("/");
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-8">
          <Logo variant="full" size="lg" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Welcome back
        </h1>

        <p className="text-base text-text-secondary/90 mt-1">
          Sign in to continue to SportsDeck
        </p>
      </div>

      <AuthCard>
        {/* OAuth */}
        <div className="space-y-3 mb-6">
          <OAuthButton
            href="/api/auth/oauth/github"
            icon={<FaGithub size={16} />}
          >
            Continue with GitHub
          </OAuthButton>

          <OAuthButton
            href="/api/auth/oauth/google"
            icon={<FcGoogle size={16} />}
          >
            Continue with Google
          </OAuthButton>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-text-muted">
            or sign in with email
          </span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            icon={Mail}
            value={email}
            onChange={(v) => {
              setEmail(v);
              setFormError(null);
            }}
            placeholder="you@example.com"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setFormError(null);
            }}
            placeholder="Your password"
          />

          <Button type="submit" loading={loading}>
            Sign in
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          New to SportsDeck?{" "}
          <Link href="/signup" className="text-primary-400 hover:underline">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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