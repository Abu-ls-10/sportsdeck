import { TokenExpiredError } from "jsonwebtoken";
import { verify_access_token } from "./auth";
import { NextResponse } from "next/server";


export function withAuth(handler: any) {
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

        if (!payload){
            return NextResponse.json({message: "Unauthorized"}, {status: 401});
        }

        // Allow them to use the endpoint
        req.user = payload;
        return handler(req);
    }
}