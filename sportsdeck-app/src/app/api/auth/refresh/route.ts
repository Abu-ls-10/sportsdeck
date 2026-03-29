import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword, verifyRefreshToken} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: New access and refresh tokens returned
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid or expired refresh token
 */
export async function POST(req: Request){
    const {refresh_token} = await req.json();

    if (!refresh_token) {
        return NextResponse.json({ message: "Bad Request" }, { status: 400 });
    }

    // Ensure the refresh token is not expired. If it is, hint for a redirection
    const payload = verifyRefreshToken(refresh_token);


    if (!payload || typeof payload === "string"){
        return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
    }

    // Extract payload information
    const {username, id, role} = payload;
    const access_payload = {username: username, id: id, role: role};


    // Find the user corresponding to the refresh token. If not found, return an unauthorized error
    try {
        const user = await prisma.user.findFirst({
            where: {
                id: id
            }
        });


        if (!user){
            return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
        }

        const isValid = await comparePassword(refresh_token, user.refresh_token ?? "");
        if (!isValid){
            return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
        }

        // Generate new access token
        const access_token = generateAccessToken(access_payload);
        const new_refresh_token = generateRefreshToken(access_payload);

        await prisma.user.update({
        where: { id: user.id },
        data: {
            refresh_token: await hashPassword(new_refresh_token)
        }
        });

        // Set cookies WITHOUT breaking response
        const res = NextResponse.json(
        {
            access_token: access_token,
            new_refresh_token: new_refresh_token
        },
        { status: 200 }
        );

        // IMPORTANT: set cookies
        res.cookies.set("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        });

        res.cookies.set("refresh_token", new_refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        });

        return res;

    }catch(error){
        console.log("CATCH ERROR:", error)
        return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }
}