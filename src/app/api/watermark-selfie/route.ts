import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Apply VSUAL V-logo watermark to selfie or business card image
 * Uses an SVG V-logo watermark (no external logo dependency)
 * Watermark: top-right corner, semi-transparent, proportional to image size
 */

/** Generate an SVG V-logo watermark */
function generateSvgWatermark(size: number): Buffer {
  const svgWatermark = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Circle background with slight transparency -->
      <circle cx="50" cy="50" r="48" fill="#C00F7A" fill-opacity="0.75" stroke="white" stroke-width="2" stroke-opacity="0.5"/>
      <!-- V letter -->
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

    // Clean base64 if it has a data URL prefix
    let cleanBase64 = image_base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Decode base64 image
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    // Get image metadata for proportional watermark sizing
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    // Watermark size: ~15% of image width, min 60px, max 180px
    const watermarkSize = Math.max(60, Math.min(180, Math.round(imgWidth * 0.15)));
    const watermarkPadding = Math.round(watermarkSize * 0.25);

    // Generate SVG V-logo watermark
    const watermarkInput = generateSvgWatermark(watermarkSize);

    // Position: top-right corner with padding
    const posX = imgWidth - watermarkSize - watermarkPadding;
    const posY = watermarkPadding;

    // Composite watermark onto image
    const outputBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: watermarkInput,
          top: posY,
          left: posX,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    // Return as base64
    const outputBase64 = outputBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      watermarked_base64: outputBase64,
      message: 'VSUAL V-logo watermark applied (SVG)',
    });
  } catch (error) {
    console.error('Watermark error:', error);
    // Return original image as fallback
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
