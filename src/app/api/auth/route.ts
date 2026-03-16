import { generateToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store: { email: { count: number; resetTime: number } }
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore[email];

  if (!entry || now > entry.resetTime) {
    // Reset rate limit
    rateLimitStore[email] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email e codice sono obbligatori' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { success: false, message: 'Troppi tentativi. Riprova tra un minuto.' },
        { status: 429 }
      );
    }

    // Verify code
    const monthlyCode = process.env.MONTHLY_CODE;
    if (code !== monthlyCode) {
      return NextResponse.json(
        { success: false, message: 'Codice o email non valido' },
        { status: 401 }
      );
    }

    // Verify email
    const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim());
    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { success: false, message: 'Codice o email non valido' },
        { status: 401 }
      );
    }

    // Generate token
    const token = await generateToken(email);

    // Create response with token in cookie
    const response = NextResponse.json(
      { success: true, token },
      { status: 200 }
    );

    // Set secure http-only cookie
    response.cookies.set('forfait-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Errore durante l\'autenticazione' },
      { status: 500 }
    );
  }
}
