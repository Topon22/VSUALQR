import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Apply VSUAL V-logo watermark to selfie or business card image
 * Uses an SVG watermark with the VSUAL brand
 * Watermark: top-right corner, semi-transparent, proportional to image size
 */

// Cache the logo buffer in memory
let cachedLogoBuffer: Buffer | null = null;
let logoFetchPromise: Promise<Buffer> | null = null;

const VSUAL_LOGO_URL = 'https://customer-assets.emergentagent.com/job_authority-capture/artifacts/5it0k4s4_vsual_logo_pink_square_wht_bk.png';

async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  if (logoFetchPromise) return logoFetchPromise;

  logoFetchPromise = (async () => {
    try {
      const response = await fetch(VSUAL_LOGO_URL);
      if (!response.ok) throw new Error(`Logo fetch failed: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      cachedLogoBuffer = Buffer.from(arrayBuffer);
      return cachedLogoBuffer;
    } catch (err) {
      console.error('[Watermark] Failed to fetch logo:', err);
      logoFetchPromise = null;
      throw err;
    }
  })();

  return logoFetchPromise;
}

/** Generate an SVG fallback V-logo watermark */
function generateSvgFallback(size: number): Buffer {
  const svgWatermark = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#C00F7A" fill-opacity="0.75" stroke="white" stroke-width="2" stroke-opacity="0.5"/>
      <text x="50" y="66" text-anchor="middle" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="48" font-weight="700" fill="white" fill-opacity="0.95">V</text>
    </svg>`;
  return Buffer.from(svgWatermark);
}

export async function POST(req: NextRequest) {
  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    let cleanBase64 = image_base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    const imageBuffer = Buffer.from(cleanBase64, 'base64');
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    const watermarkSize = Math.max(60, Math.min(180, Math.round(imgWidth * 0.15)));
    const watermarkPadding = Math.round(watermarkSize * 0.25);

    let watermarkInput: Buffer;
    let usedLogoImage = false;

    try {
      const logoBuffer = await getLogoBuffer();
      watermarkInput = await sharp(logoBuffer)
        .resize(watermarkSize, watermarkSize, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
      usedLogoImage = true;
    } catch {
      console.warn('[Watermark] Using SVG fallback instead of logo image');
      watermarkInput = generateSvgFallback(watermarkSize);
    }

    const posX = imgWidth - watermarkSize - watermarkPadding;
    const posY = watermarkPadding;

    const outputBuffer = await sharp(imageBuffer)
      .composite([{ input: watermarkInput, top: posY, left: posX }])
      .jpeg({ quality: 90 })
      .toBuffer();

    const outputBase64 = outputBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      watermarked_base64: outputBase64,
      message: usedLogoImage
        ? 'VSUAL V-logo watermark applied (official logo)'
        : 'VSUAL V-logo watermark applied (SVG fallback)',
    });
  } catch (error) {
    console.error('Watermark error:', error);
    return NextResponse.json(
      {
        success: true,
        watermarked_base64: null,
        message: 'Watermark failed, using original image',
      },
      { status: 200 }
    );
  }
}
