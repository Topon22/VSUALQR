import { NextResponse } from 'next/server';
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
          error.message.includes('P2024') || // Connection pool timeout
          error.message.includes('P1001') || // Cannot reach database server
          error.message.includes('P1008') || // Operations timed out
          error.message.includes('timed out') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('Connection refused')
        );
      if (!isRetryable || attempt === maxRetries) break;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[Images API] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, error instanceof Error ? error.message : 'Unknown');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * GET /api/images
 * List all contacts with their stored images (metadata only, no base64)
 * Includes retry logic for Prisma cold-start connection pool warmup.
 */
export async function GET() {
  try {
    const contacts = await withRetry(() =>
      db.contact.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          company: true,
          title: true,
          email: true,
          phone: true,
          source: true,
          selfieBase64: true,
          brandedSelfieBase64: true,
          businessCardBase64: true,
          selfieDriveUrl: true,
          cardDriveUrl: true,
          createdAt: true,
        },
      })
    );

    const imageEntries = contacts
      .filter((c) => c.selfieBase64 || c.brandedSelfieBase64 || c.businessCardBase64)
      .map((c) => {
        const images: Array<{
          type: string;
          label: string;
          url: string;
          hasData: boolean;
        }> = [];

        if (c.selfieBase64) {
          images.push({
            type: 'selfie',
            label: 'Selfie',
            url: `/api/images/${c.id}?type=selfie`,
            hasData: true,
          });
        }
        if (c.brandedSelfieBase64) {
          images.push({
            type: 'branded',
            label: 'Branded Selfie',
            url: `/api/images/${c.id}?type=branded`,
            hasData: true,
          });
        }
        if (c.businessCardBase64) {
          images.push({
            type: 'card',
            label: 'Business Card',
            url: `/api/images/${c.id}?type=card`,
            hasData: true,
          });
        }

        return {
          contactId: c.id,
          name: (c.name || 'Unknown').trim(),
          company: c.company?.trim() || null,
          title: c.title?.trim() || null,
          email: c.email?.trim() || null,
          phone: c.phone?.trim() || null,
          source: c.source,
          images,
          totalImages: images.length,
          selfieDriveUrl: c.selfieDriveUrl,
          cardDriveUrl: c.cardDriveUrl,
          createdAt: c.createdAt,
        };
      });

    const totalImages = imageEntries.reduce((sum, e) => sum + e.totalImages, 0);

    return NextResponse.json({
      success: true,
      entries: imageEntries,
      totalContacts: imageEntries.length,
      totalImages,
      message: `Found ${totalImages} images across ${imageEntries.length} contacts`,
    });
  } catch (error) {
    console.error('Image list error:', error);
    return NextResponse.json(
      {
        success: false,
        entries: [],
        totalContacts: 0,
        totalImages: 0,
        message: `Failed to load images: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    );
  }
}
