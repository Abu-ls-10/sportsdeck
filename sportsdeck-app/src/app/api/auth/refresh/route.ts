import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword, verifyRefreshToken} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const {refresh_token} = await req.json();

    // Ensure the refresh token is not expired. If it is, hint for a redirection
    const payload = verifyRefreshToken(refresh_token);

    if (!payload || typeof payload === "string"){
        return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
    }

    // Extract payload information
    const {username, user_id, role} = payload;
    const access_payload = {username: username, user_id: user_id, role: role};


    // Find the user corresponding to the refresh token. If not found, return an unauthorized error
    try {
        const user = await prisma.user.findFirst({
            where: {
                id: user_id
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
        const refresh = generateRefreshToken(access_payload);

        await prisma.user.update({
            where: {id: user.id},
            data: {
                refresh_token: await hashPassword(refresh)
            }
        })

        return NextResponse.json({access_token: access_token, new_refresh_token: refresh}, {status: 200});

    }catch(error){
        return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }
}