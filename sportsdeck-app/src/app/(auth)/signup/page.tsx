"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setError("Enter a valid email");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await signup(email, password);
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    router.push("/");
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4 text-white font-bold text-xl">
          SD
        </div>

        <h1 className="text-2xl font-semibold text-text-primary">
          Create your account
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Join SportsDeck and start engaging with fans
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
            or sign up with email
          </span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
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
              setError(null);
            }}
            placeholder="you@example.com"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError(null);
            }}
            placeholder="At least 8 characters"
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              setError(null);
            }}
            placeholder="Repeat your password"
          />

          <Button type="submit" loading={loading}>
            Create account
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-400 hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}