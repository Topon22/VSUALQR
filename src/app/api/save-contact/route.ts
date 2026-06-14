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
  card_base64?: string;
  source?: string;
}

/**
 * POST - Save contact to local SQLite database via Prisma
 *
 * Flow:
 * 1. Save contact record with all fields including images (base64 stored in DB)
 * 2. Return success status
 */
export async function POST(req: NextRequest) {
  try {
    const body: SaveContactRequest = await req.json();
    const { name, company, title, email, phone, address, selfie_base64, card_base64, source } = body;

    if (!name && !email && !phone) {
      return NextResponse.json(
        { error: 'At least name, email, or phone is required' },
        { status: 400 }
      );
    }

    const start = Date.now();

    // Save contact to database
    const record = await db.contact.create({
      data: {
        name: name || '',
        company: company || '',
        title: title || '',
        email: email || '',
        phone: phone || '',
        address: address || '',
        source: source || 'VSUAL Networking App',
        selfieBase64: selfie_base64 || null,
        brandedSelfieBase64: selfie_base64 || null,
        businessCardBase64: card_base64 || null,
        ghlStatus: 'skipped',
        driveStatus: 'skipped',
        whatsappStatus: 'skipped',
      },
    });

    const dbStatus = !!record ? 'success' : 'error';
    const latencyMs = Date.now() - start;

    const message = dbStatus === 'success'
      ? `Contact saved to database! (${latencyMs}ms)`
      : 'Failed to save contact.';

    return NextResponse.json({
      success: dbStatus === 'success',
      message,
      ghl_status: 'skipped',
      ghl_message: 'GHL integration not available in this deployment',
      drive_status: 'skipped',
      drive_message: 'Cloud storage not available in this deployment',
      db_status: dbStatus,
      db_layer: 'sqlite',
      db_message: message,
      whatsapp_status: 'skipped',
      whatsapp_message: 'Use the Share to WhatsApp button on the success screen.',
      selfie_drive_url: null,
      card_drive_url: null,
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
 * GET - List all contacts from the database
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
      source: 'sqlite',
      message: `Loaded ${contacts.length} contacts from SQLite`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      contacts: [],
      count: 0,
      message: 'Database unavailable.',
    });
  }
}
