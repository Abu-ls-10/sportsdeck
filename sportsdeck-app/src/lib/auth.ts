import bcrypt from 'bcryptjs'
// @ts-check

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '39');
const JWT_SECRET=process.env.JWT_SECRET;
const JWT_EXPIRATION=process.env.JWT_EXPIRATION;

/**
 * @param {string} open_password
 */
export async function hashpassword(open_password){
    return await bcrypt.hash(open_password, SALT_ROUNDS);
}

/**
 * @param {string} potential_password
 * @param {string} real_password
 */
export async function compare_password(potential_password, real_password){
    return await bcrypt.compare(potential_password, real_password);
}