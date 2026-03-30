import { verifyAccessToken } from "./auth";
import { NextResponse, NextRequest } from "next/server";
import { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends NextRequest {
  user: JwtPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  role?: string
) {
  return (req: NextRequest, context?: any) => {
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

    // Banned user
    if (payload.isBanned) {
      return NextResponse.json(
        { message: "Your account has been banned" },
        { status: 403 }
      );
    }

    // Role check
    if (role && payload.role !== role) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Attach user
    const authedReq = req as AuthenticatedRequest;
    authedReq.user = payload;

    return handler(authedReq, context);
  };
}