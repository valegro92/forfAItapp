import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { Redis } from '@upstash/redis';

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL || '',
    token: process.env.KV_REST_API_TOKEN || '',
  });
}

// GET: load user data
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('forfait-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const verified = await verifyToken(token);
    if (!verified) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }

    const redis = getRedis();
    const data = await redis.get(`userdata:${verified.email}`);

    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return NextResponse.json({ success: true, data: parsed });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Load userdata error:', error);
    return NextResponse.json({ error: 'Errore caricamento dati' }, { status: 500 });
  }
}

// POST: save user data
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('forfait-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const verified = await verifyToken(token);
    if (!verified) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, incassi, costi } = body;

    const redis = getRedis();
    await redis.set(
      `userdata:${verified.email}`,
      JSON.stringify({ profile, incassi, costi, updatedAt: new Date().toISOString() })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save userdata error:', error);
    return NextResponse.json({ error: 'Errore salvataggio dati' }, { status: 500 });
  }
}
