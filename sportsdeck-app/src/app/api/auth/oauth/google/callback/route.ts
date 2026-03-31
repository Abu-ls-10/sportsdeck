import { generateAccessToken, generateRefreshToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth_cancelled`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${appUrl}/api/auth/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
    }

    // Fetch Google user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile: GoogleUserInfo = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${appUrl}/login?error=no_email`);
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      // Derive a username from the Google display name or email prefix
      const baseUsername = (profile.name ?? profile.email.split("@")[0])
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 30);

      // Ensure uniqueness
      let username = baseUsername;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix++}`;
      }

      user = await prisma.user.create({
        data: {
          email: profile.email,
          username,
          avatarUrl: profile.picture ?? null,
          authProvider: "google",
          providerUserId: profile.sub,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "google",
          providerUserId: profile.sub,
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

    const redirectParams = new URLSearchParams({ access_token, refresh_token });
    return NextResponse.redirect(`${appUrl}/auth/callback?${redirectParams.toString()}`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}
