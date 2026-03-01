import {prisma} from '@/lib/prisma';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import { hashpassword, generate_token } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request){

    // Get usernames, emails, password. 
    const {username, email, password} = await req.json();
    
    // Try to create a new user instance. If created, just return user without password
    try {
        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashpassword(password),
                email: email
            }
        });

        // Return a JWT token. They are logged in
        const token = generate_token({username: user.username, user_id: user.user_id, role: user.role});
    
        return NextResponse.json({token: token}, {status: 201});

    }

    catch (error){
        // Get the specific field error
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002' ){
            return NextResponse.json({message: `${error.meta?.target} already exists`}, {status: 409 })
        }
        return NextResponse.json({message: "Something went wrong"}, {status: 500})
    }

    
}