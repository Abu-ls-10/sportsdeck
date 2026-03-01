import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


// @ts-check

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');
const JWT_ACCESS_SECRET=process.env.JWT_ACCESS_SECRET || '';
const JWT_ACCESS_EXPIRATION=process.env.JWT_ACCESS_EXPIRATION || '1h';
const JWT_REFRESH_SECRET=process.env.JWT_REFRESH_SECRET || '';
const JWT_REFRESH_EXPIRATION=process.env.JWT_REFRESH_EXPIRATION || '30d';



export async function hashpassword(open_password: string){
    return await bcrypt.hash(open_password, SALT_ROUNDS);
}


export async function compare_password(potential_password: string, real_password: string){
    return await bcrypt.compare(potential_password, real_password);
}

// For creating JSON web tokens
export function generate_access_token(payload: string | object){
    return jwt.sign(payload, JWT_ACCESS_SECRET, {expiresIn: JWT_ACCESS_EXPIRATION as any})
}

export function verify_access_token(token: string){
    return jwt.verify(token, JWT_ACCESS_SECRET);
}

// For creating refresh tokens.

export function generate_refresh_token(payload: string | object){
    return jwt.sign(payload, JWT_REFRESH_SECRET, {expiresIn: JWT_REFRESH_EXPIRATION as any})
}

export function verify_refresh_token(token: string){
    return jwt.verify(token, JWT_REFRESH_SECRET);
}
