import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/images
 * List all contacts with their stored images (metadata only, no base64)
 */
export async function GET() {
  try {
    const contacts = await db.contact.findMany({
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
    });

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
          name: c.name || 'Unknown',
          company: c.company,
          title: c.title,
          email: c.email,
          phone: c.phone,
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
