import { comparePasswords, createToken } from '@/lib/auth';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  // In a real application, fetch user from database (MongoDB)
  // For simplicity, using environment variables
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_HASHED_PASSWORD; // Store hashed password in env

  if (!adminUsername || !adminPasswordHash) {
    console.error("Admin credentials not set in environment variables.");
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    // Compare the provided password with the stored hash
    const passwordMatch = await comparePasswords(password, adminPasswordHash);

    if (!passwordMatch || username !== adminUsername) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // User authenticated, create a JWT token
    const token = createToken({ username: adminUsername });

    // Set the token in a cookie or return it in the response body
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60}`); // Set cookie for 1 hour

    return res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}