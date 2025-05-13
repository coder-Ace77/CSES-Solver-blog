import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const saltRounds = 10;

export const hashPassword = async (password: string): Promise<string> => {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    console.log(password, hashedPassword);
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
};

export const createToken = (payload: object): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Token expires in 1 hour
    return token;
};

export const verifyToken = (token: string): any => {
    const secret = process.env.JWT_SECRET;
    console.log('JWT_SECRET:', secret);
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};