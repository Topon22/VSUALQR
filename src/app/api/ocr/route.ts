import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/** Ensure Z AI config exists for Vercel serverless deployment */
function ensureZAIConfig() {
  const target = path.join(process.cwd(), '.z-ai-config');
  if (fs.existsSync(target)) return;
  const envConfig = process.env.Z_AI_CONFIG;
  if (envConfig) {
    try { fs.writeFileSync(target, envConfig); } catch {}
  }
}

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

export async function POST(req: NextRequest) {
  try {
    ensureZAIConfig();
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    let cleanBase64 = image_base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Use Z AI Vision (FREE) for OCR
    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      model: 'qwen/qwen2.5-vl-72b-instruct',
      messages: [
        { role: 'assistant', content: OCR_SYSTEM_PROMPT },
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

    if (!text) {
      return NextResponse.json({
        error: 'OCR failed: Z AI Vision returned empty response.',
        name: '', company: '', title: '', email: '', phone: '', address: '',
      }, { status: 500 });
    }

    const parsed = parseOCRResponse(text);
    return NextResponse.json({ ...parsed, ocr_provider: 'z-ai-vision' });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json({
      error: `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      name: '', company: '', title: '', email: '', phone: '', address: '',
    }, { status: 500 });
  }
}
