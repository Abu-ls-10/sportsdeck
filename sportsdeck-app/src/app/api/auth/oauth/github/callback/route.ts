import { generateAccessToken, generateRefreshToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth_cancelled`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appUrl}/api/auth/oauth/github/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
    }

    // Fetch GitHub user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Fetch primary email if not public
    let email: string | null = profile.email ?? null;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails: { email: string; primary: boolean; verified: boolean }[] =
        await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }

    if (!email) {
      return NextResponse.redirect(`${appUrl}/login?error=no_email`);
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: profile.login ?? null,
          avatarUrl: profile.avatar_url ?? null,
          authProvider: "github",
          providerUserId: String(profile.id),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "github",
          providerUserId: String(profile.id),
        },
      });
    }

    // Issue our own JWT tokens
    const payload = {
      username: user.username,
      id: user.id,
      role: user.role,
      isBanned: user.isBanned,
    };
    const access_token = generateAccessToken(payload);
    const refresh_token = generateRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: await hashPassword(refresh_token) },
    });

    // Redirect to frontend with tokens in query params (picked up by the callback page)
    const redirectParams = new URLSearchParams({
      access_token,
      refresh_token,
    });
    return NextResponse.redirect(`${appUrl}/auth/callback?${redirectParams.toString()}`);
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}
