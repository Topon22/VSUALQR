import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SaveContactRequest {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address?: string;
  selfie_base64?: string;
  branded_selfie_base64?: string;
  card_base64?: string;
  source?: string;
}

/**
 * POST - Save contact to database
 * Flow:
 * 1. Save contact record to PostgreSQL via Prisma
 * 2. Return status
 */
export async function POST(req: NextRequest) {
  try {
    const body: SaveContactRequest = await req.json();
    const { selfie_base64, branded_selfie_base64, card_base64, source } = body;
    // Trim whitespace from all text fields to prevent data quality issues
    const name = (body.name || '').trim();
    const company = (body.company || '').trim();
    const title = (body.title || '').trim();
    const email = (body.email || '').trim();
    const phone = (body.phone || '').trim();
    const address = (body.address || '').trim();

    if (!name && !email && !phone) {
      return NextResponse.json(
        { error: 'At least name, email, or phone is required' },
        { status: 400 }
      );
    }

    let ghlStatus = 'skipped';
    let driveStatus = 'skipped';

    // Try GHL contact creation if configured
    try {
      const { createGHLContact } = await import('@/lib/ghl');
      const ghlResult = await createGHLContact({ name, company, title, email, phone, address, source: (source || 'VSUAL Networking App').trim() });
      ghlStatus = ghlResult.status;
    } catch {
      ghlStatus = 'error';
    }

    // Save contact to database
    const contact = await db.contact.create({
      data: {
        name,
        company,
        title,
        email,
        phone,
        address,
        source: (source || 'VSUAL Networking App').trim(),
        selfieBase64: selfie_base64 || null,
        brandedSelfieBase64: branded_selfie_base64 || selfie_base64 || null,
        businessCardBase64: card_base64 || null,
        selfieDriveUrl: null,
        cardDriveUrl: null,
        ghlStatus,
        driveStatus,
        whatsappStatus: 'skipped',
      },
    });

    // Generate image serving URLs
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || '';
    const selfie_drive_url = `${baseUrl}/api/images/${contact.id}?type=selfie`;
    const branded_drive_url = `${baseUrl}/api/images/${contact.id}?type=branded`;
    const card_drive_url = `${baseUrl}/api/images/${contact.id}?type=card`;

    // Update contact with drive URLs
    await db.contact.update({
      where: { id: contact.id },
      data: {
        selfieDriveUrl: selfie_drive_url,
        cardDriveUrl: card_drive_url,
        driveStatus: 'success',
      },
    });

    const dbStatus = 'success';

    // Build status summary
    const anySuccess = ghlStatus === 'success' || dbStatus === 'success';
    const parts: string[] = [];
    if (dbStatus === 'success') parts.push('saved to DB');
    if (ghlStatus === 'success') parts.push('added to GoHighLevel');
    if (ghlStatus === 'tracked') parts.push('tracked via GHL pixel');
    const message = anySuccess
      ? `Contact ${parts.join(' & ')}!`
      : 'Contact saved locally. Integrations not configured.';

    return NextResponse.json({
      success: anySuccess,
      message,
      ghl_status: ghlStatus,
      ghl_message: '',
      drive_status: driveStatus,
      drive_message: 'Image storage uses database (Prisma PostgreSQL).',
      db_status: dbStatus,
      db_layer: 'prisma-postgresql',
      db_message: `Contact saved (ID: ${contact.id})`,
      whatsapp_status: 'skipped',
      whatsapp_message: 'Use the Share to WhatsApp button on the success screen.',
      selfie_drive_url: selfie_drive_url,
      branded_drive_url: branded_drive_url,
      card_drive_url: card_drive_url,
      contact: { name, company, title, email, phone, address },
    });
  } catch (error) {
    console.error('Save contact error:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ghl_status: 'error',
        drive_status: 'error',
        db_status: 'error',
        whatsapp_status: 'error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List all contacts
 */
export async function GET() {
  try {
    const contacts = await db.contact.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        company: true,
        title: true,
        email: true,
        phone: true,
        address: true,
        source: true,
        ghlStatus: true,
        driveStatus: true,
        whatsappStatus: true,
        selfieDriveUrl: true,
        cardDriveUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
      source: 'prisma-postgresql',
      message: `Loaded ${contacts.length} contacts`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      contacts: [],
      count: 0,
      message: `Database unavailable: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }
}
