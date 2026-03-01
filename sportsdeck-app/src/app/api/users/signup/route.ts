import prisma from '@';
import {Prisma} from '@prisma/client';
import { hashpassword } from '../../../../lib/auth';

/**
 * @param {{ username: any; email: any; password: any; }} req
 */
export async function POST(req){

    // Get usernames, emails, password. 
    const {username, email, password} = req
    
    // Try to create a new user instance
    try {
        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashpassword(password),
                email: email
            }
        })

    }

    catch (error){
        // Get the specific field error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' ){
            return NextResponse.json({message: `${error.meta?.target} already exists`}, {status: 409 })
        }
    }

    
}