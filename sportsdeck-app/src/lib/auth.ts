import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


// @ts-check

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '39');
const JWT_SECRET=process.env.JWT_SECRET || '';
const JWT_EXPIRATION=process.env.JWT_EXPIRATION || '1h';


export async function hashpassword(open_password: string){
    return await bcrypt.hash(open_password, SALT_ROUNDS);
}


export async function compare_password(potential_password: string, real_password: string){
    return await bcrypt.compare(potential_password, real_password);
}

// For creating JSON web tokens
export function generate_token(payload: string | object){
    return jwt.sign(payload, JWT_SECRET, {expiresIn: JWT_EXPIRATION as any})
}

export function verify_token(token: string){
    try{
        return jwt.verify(token, JWT_SECRET)
    } 
    catch (error){
        return null; 
    }
}

