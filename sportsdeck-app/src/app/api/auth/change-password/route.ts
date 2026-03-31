import { NextResponse } from "next/server";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

async function postHandler(req: AuthenticatedRequest) {
  let body: {
    currentPassword?: string;
    newPassword?: string;
    passwordConfirmation?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { currentPassword, newPassword, passwordConfirmation } = body;
  if (!currentPassword || !newPassword || !passwordConfirmation) {
    return NextResponse.json(
      { message: "Current password, new password, and confirmation are required." },
      { status: 400 }
    );
  }

  if (newPassword !== passwordConfirmation) {
    return NextResponse.json({ message: "New password and confirmation do not match." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const userId = typeof req.user.id === "string" ? req.user.id : null;
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      isBanned: true,
      passwordHash: true,
      authProvider: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const provider = user.authProvider?.toLowerCase() ?? "";
  if (provider === "google" || provider === "github") {
    return NextResponse.json(
      { message: "Password cannot be changed for accounts signed in with Google or GitHub." },
      { status: 403 }
    );
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { message: "This account does not have a password set." },
      { status: 403 }
    );
  }

  const currentOk = await comparePassword(currentPassword, user.passwordHash);
  if (!currentOk) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 });
  }

  const sameAsOld = await comparePassword(newPassword, user.passwordHash);
  if (sameAsOld) {
    return NextResponse.json(
      { message: "New password must be different from your current password." },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(newPassword);
  const payload = {
    username: user.username,
    id: user.id,
    role: user.role,
    isBanned: user.isBanned,
  };
  const access_token = generateAccessToken(payload);
  const refresh_token = generateRefreshToken(payload);
  const hashedRefresh = await hashPassword(refresh_token);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      refresh_token: hashedRefresh,
    },
  });

  const res = NextResponse.json(
    { access_token, refresh_token, message: "Password updated successfully." },
    { status: 200 }
  );
  res.cookies.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.cookies.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export const POST = withAuth(postHandler);
