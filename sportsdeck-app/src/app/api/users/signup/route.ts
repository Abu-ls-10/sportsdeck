import {prisma} from '@/lib/prisma';
import {Prisma} from '@/generated/prisma';
import { hashpassword, generate_access_token, generate_refresh_token} from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request){

    // Get usernames, emails, password. 
    const {username, email, password} = await req.json();
    
    // Try to create a new user instance. If created, just return user without password
    try {
        const user = await prisma.user.create({
            data: {
                username: username,
                password: await hashpassword(password),
                email: email
            }
        });  

        // Return a JWT token. They are logged in
        const payload = {username: user.username, user_id: user.id, role: user.role};
        const access_token = generate_access_token(payload);
        const refresh_token = generate_refresh_token(payload)

        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id},
            data: {refresh_token: refresh_token}
        })
    
        return NextResponse.json({access_token: access_token, refresh_token: refresh_token}, {status: 201});

    }

    catch (error){
        // Get the specific field error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' ){
            return NextResponse.json({message: `${error.meta?.target} already exists`}, {status: 409 })
        }
        return NextResponse.json({message: "Something went wrong"}, {status: 500})
    }
    
}