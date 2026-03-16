import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production'
);

export async function generateToken(email: string): Promise<string> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return { email: verified.payload.email as string };
  } catch (error) {
    return null;
  }
}