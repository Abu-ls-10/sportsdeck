import { verifyAccessToken } from "./auth";
import { NextResponse, NextRequest } from "next/server";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedRequest extends NextRequest {
  user: JwtPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  role?: string
) {
  return async (req: NextRequest, context?: any) => {
    let token: string | null = null;

    // Try Authorization header (Postman / external clients)
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fallback to cookies (your frontend)
    if (!token) {
      token = req.cookies.get("access_token")?.value ?? null;
    }

    // No token found
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const payload = verifyAccessToken(token);

    if (!payload || typeof payload === "string") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Always resolve auth-sensitive flags from DB so bans/role changes apply immediately.
    const userId = typeof payload.id === "string" ? payload.id : null;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isBanned: true },
    });

    if (!dbUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (dbUser.isBanned) {
      return NextResponse.json(
        { message: "Your account has been banned" },
        { status: 403 }
      );
    }

    // Role check
    const normalizedDbRole = String(dbUser.role ?? "").trim().toUpperCase();
    const normalizedRequiredRole = role ? String(role).trim().toUpperCase() : null;
    if (normalizedRequiredRole && normalizedDbRole !== normalizedRequiredRole) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Attach user
    const authedReq = req as AuthenticatedRequest;
    authedReq.user = {
      ...payload,
      id: dbUser.id,
      role: normalizedDbRole,
      isBanned: dbUser.isBanned,
    };

    return handler(authedReq, context);
  };
}