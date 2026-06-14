import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, selfieUrl, cardUrl } = body;

    if (contactId) {
      const updateData: Record<string, string> = { driveStatus: 'success' };
      if (selfieUrl) updateData.selfieDriveUrl = selfieUrl;
      if (cardUrl) updateData.cardDriveUrl = cardUrl;
      await db.contact.update({
        where: { id: contactId },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, message: 'File references stored in database.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: `Failed: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: true,
    provider: 'Prisma PostgreSQL',
    message: 'File storage uses database references.',
  });
}
