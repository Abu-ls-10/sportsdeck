import {prisma} from '@/lib/prisma';
import {Prisma} from '@/generated/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken} from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request){

    // Get usernames, emails, password. 
    const {username, email, password} = await req.json();
    
    // Try to create a new user instance. If created, just return user without password
    try {
        const user = await prisma.user.create({
            data: {
                username: username,
                passwordHash: await hashPassword(password),
                email: email
            }
        });  

        // Return a JWT token. They are logged in
        const payload = {username: user.username, user_id: user.id, role: user.role};
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(payload)
    
        return NextResponse.json({access_token: access_token, refresh_token: refresh_token}, {status: 201});

    }

    catch (error){
        console.error("SIGNUP ERROR:", error);
        // Get the specific field error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' ){
            return NextResponse.json({message: `${error.meta?.target} already exists`}, {status: 409 })
        }
        return NextResponse.json({message: "Something went wrong", error: String(error)}, {status: 500})
    }
    
}