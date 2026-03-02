import { generate_access_token, verify_refresh_token} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const {refresh_token} = await req.json();

    // Find the user corresponding to the refresh token. If not found, return an unauthorized error
    try {
        const user = await prisma.user.findFirst({
            where: {
                refresh_token: refresh_token
            }
        });

        if (!user){
            return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
        }

        // Ensure the refresh token is not expired. If it is, hint for a redirection
        const payload = verify_refresh_token(refresh_token);
        if (!payload || typeof payload === "string"){
            return NextResponse.json({message: "Unauthorized", redirect: "/api/auth/login"}, {status: 401});
        }

        // Extract payload information
        const {username, user_id, role} = payload;
        const access_payload = {username: username, user_id: user_id, role: role};

        // Generate new access token
        const access_token = generate_access_token(access_payload);

        return NextResponse.json({access_token: access_token}, {status: 201});

    }catch(error){
        return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }
}