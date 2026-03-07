import {prisma} from '@/lib/prisma';
import {Prisma} from '@/generated/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken} from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request){

    // Get usernames, emails, password. 
    const {username, email, password} = await req.json();

    if (!username){
        return NextResponse.json({message: "Please provide a username"}, {status: 400});
    }
    if (!email){
        return NextResponse.json({message: "Please provide an email"}, {status: 400});
    }
    if (!password){
        return NextResponse.json({message: "Please provide a password"}, {status: 400});
    }
    
    // Try to create a new user instance. If created, just return user without password
    try {
        const username_exists = await prisma.user.findUnique({where: {username: username}})
        const email_exists = await prisma.user.findUnique({where: {email:email}})

        if (username_exists){
            return NextResponse.json({message: `${username} already exists`}, {status: 409 })    
        }
        
        if (email_exists){
            return NextResponse.json({message: `${email} already exists`}, {status: 409 })    
        }

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

        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id},
            data: {refresh_token: refresh_token}
        })
    
        return NextResponse.json({access_token: access_token, refresh_token: refresh_token}, {status: 201});

    }

    catch (error){
        console.error(error);
        // Get the specific field error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' ){
            return NextResponse.json({message: `${error.meta?.target} already exists`}, {status: 409 })
        }
        return NextResponse.json({message: "Something went wrong"}, {status: 500})
    }
    
}