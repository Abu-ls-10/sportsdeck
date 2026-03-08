import { generateAccessToken, verifyRefreshToken} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const {refresh_token} = await req.json();

    try {
        // Verify the refresh token is valid and not expired
        const payload = verifyRefreshToken(refresh_token);
        if (!payload || typeof payload === "string"){
            return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
        }

        // Ensure the user still exists
        const user = await prisma.user.findUnique({
            where: { id: payload.user_id }
        });

        if (!user){
            return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
        }

        // Extract payload information with fresh ban status from DB
        const access_payload = {username: user.username, user_id: user.id, role: user.role, isBanned: user.isBanned};

        // Generate new access token
        const access_token = generateAccessToken(access_payload);

        return NextResponse.json({access_token: access_token}, {status: 201});

    }catch(error){
        return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }
}