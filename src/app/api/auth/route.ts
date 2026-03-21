import { generateToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Admin emails: sempre autorizzate senza Redis
const ADMIN_EMAILS = ['ai@valentinogrossi.it'];

// In-memory rate limiting store
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

const RATE_LIMIT_MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore[key];

  if (!entry || now > entry.resetTime) {
    rateLimitStore[key] = {
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
    const { email } = await request.json();

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email obbligatoria' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check rate limit by IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, message: 'Troppi tentativi. Riprova tra un minuto.' },
        { status: 429 }
      );
    }

    // Admin bypass
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      const token = await generateToken(normalizedEmail);
      const response = NextResponse.json(
        { success: true, token },
        { status: 200 }
      );
      response.cookies.set('forfait-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      });
      return response;
    }

    // Check Upstash Redis for subscriber
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || '',
      token: process.env.KV_REST_API_TOKEN || '',
    });

    const subscriberData = await redis.get(`subscriber:${normalizedEmail}`);

    if (subscriberData) {
      const data = typeof subscriberData === 'string' ? JSON.parse(subscriberData) : subscriberData;
      const expiry = new Date(data.expiresAt);

      if (expiry > new Date()) {
        // Subscriber valido
        const token = await generateToken(normalizedEmail);
        const response = NextResponse.json(
          { success: true, token },
          { status: 200 }
        );
        response.cookies.set('forfait-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60,
          path: '/',
        });
        return response;
      }
    }

    // Non autorizzato
    return NextResponse.json(
      { success: false, message: "Email non trovata tra gli abbonati attivi de L'Officina" },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: "Errore durante l'autenticazione" },
      { status: 500 }
    );
  }
}
