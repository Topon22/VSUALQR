import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await db.contact.count();
    return NextResponse.json({
      configured: true,
      provider: 'Prisma PostgreSQL',
      contactCount: count,
      message: 'Database is operational.',
    });
  } catch {
    return NextResponse.json({
      configured: false,
      provider: 'Prisma PostgreSQL',
      contactCount: 0,
      message: 'Database not available.',
    });
  }
}
