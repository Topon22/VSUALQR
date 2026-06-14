import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OCR_SYSTEM_PROMPT = `You are a high-accuracy OCR assistant specialized in extracting contact information from business cards.
Extract the following fields from the business card image:
- Name (full name of the person)
- Company (business/organization name)
- Title (job title/position)
- Email (email address)
- Phone (phone number including area code)
- Address (full mailing address if present)

Return ONLY a JSON object with these exact keys: name, company, title, email, phone, address
If a field is not visible or unclear, use an empty string "".
Be precise and accurate. Do not make up information.`;

function parseOCRResponse(rawContent: string) {
  const jsonMatch = rawContent.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      return {
        name: data.name || '',
        company: data.company || '',
        title: data.title || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        raw_text: rawContent,
      };
    } catch {
      // JSON parse failed
    }
  }

  return {
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    raw_text: rawContent,
    error: 'Could not parse structured data from OCR response',
  };
}

/** Z AI Vision (FREE - primary) */
async function ocrViaZAI(cleanBase64: string): Promise<{ text: string; provider: string } | null> {
  try {
    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      messages: [
        { role: 'system', content: OCR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all contact information from this business card image. Return only valid JSON with keys: name, company, title, email, phone, address.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const text = response.choices[0]?.message?.content || '';
    if (text) return { text, provider: 'z-ai-vision' };
  } catch (err) {
    console.error('[OCR] z-ai failed:', err instanceof Error ? err.message : err);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    let cleanBase64 = image_base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Try Z AI Vision (free)
    let result = await ocrViaZAI(cleanBase64);

    if (!result) {
      return NextResponse.json({
        error: 'OCR failed: Z AI Vision service unavailable.',
        name: '', company: '', title: '', email: '', phone: '', address: '',
      }, { status: 500 });
    }

    const parsed = parseOCRResponse(result.text);
    return NextResponse.json({ ...parsed, ocr_provider: result.provider });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json({
      error: `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      name: '', company: '', title: '', email: '', phone: '', address: '',
    }, { status: 500 });
  }
}
