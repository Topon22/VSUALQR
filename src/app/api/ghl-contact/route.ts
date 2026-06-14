import { NextRequest, NextResponse } from 'next/server';
import { createGHLContact, getGHLStatus } from '@/lib/ghl';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, title, email, phone, address, source } = body;
    const result = await createGHLContact({ name, company, title, email, phone, address, source });

    if (result.status === 'error') {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('GHL Contact API error:', error);
    return NextResponse.json(
      { success: false, status: 'error', message: `Failed: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(getGHLStatus());
}
