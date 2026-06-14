import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Retry a database operation with exponential backoff.
 * Handles Prisma cold-start connection pool warmup on first request.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof Error && (
          error.message.includes('P2024') ||
          error.message.includes('P1001') ||
          error.message.includes('P1008') ||
          error.message.includes('timed out') ||
          error.message.includes('ECONNREFUSED')
        );
      if (!isRetryable || attempt === maxRetries) break;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[Image Serve] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, error instanceof Error ? error.message : 'Unknown');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * GET /api/images/[id]?type=selfie|branded|card
 * Serve a stored image from the database as a JPEG response
 * Includes retry logic for Prisma cold-start connection pool warmup.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get('type') || 'selfie';

    const contact = await withRetry(() =>
      db.contact.findUnique({
        where: { id },
        select: {
          selfieBase64: true,
          brandedSelfieBase64: true,
          businessCardBase64: true,
          name: true,
        },
      })
    );

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    let base64Data: string | null = null;

    switch (type) {
      case 'selfie':
        base64Data = contact.selfieBase64;
        break;
      case 'branded':
        base64Data = contact.brandedSelfieBase64 || contact.selfieBase64;
        break;
      case 'card':
        base64Data = contact.businessCardBase64;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type. Use selfie, branded, or card' }, { status: 400 });
    }

    if (!base64Data) {
      return NextResponse.json({ error: `No ${type} image found for this contact` }, { status: 404 });
    }

    // Strip data URI prefix if present
    const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    const buffer = Buffer.from(rawBase64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Image-Type': type,
        'X-Contact-Name': encodeURIComponent(contact.name?.trim() || 'Unknown'),
      },
    });
  } catch (error) {
    console.error('Image serve error:', error);
    return NextResponse.json(
      { error: `Failed to serve image: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
