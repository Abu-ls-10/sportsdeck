import { TokenExpiredError } from "jsonwebtoken";
import { verify_access_token } from "./auth";
import { NextResponse } from "next/server";


export function withAuth(handler: any, role?: string) {
    return (req: any) => {
        //Get the info from Authorization header inside the request. Authorization header is not guaranteed to be there
        const authHeader = req.headers.get('authorization');
        if (!authHeader){
            return NextResponse.json({message: "Unauthorized"}, {status: 401});
        }

        const info = authHeader.split(" ");

        //Verify the token in the second entry. If invalid, return an unauthorized error. Otherwise, continue with the handler.
        const access_token = info[1];
        const payload = verify_access_token(access_token);

        if (typeof payload === "string" || (!payload)){
            return NextResponse.json({message: "Unauthorized"}, {status: 401});
        }

        // Allow them to use the endpoint
        if (role && payload.role !== role){
            return NextResponse.json({message: "Forbidden"}, {status: 403});
        }
        
        req.user = payload;
        return handler(req);
    }
}