/**
 * VSUAL Networking App — Shared Utilities
 *
 * Image processing helpers used across components.
 * All functions are client-safe (no Node.js APIs).
 */

/** Convert a File object to a raw base64 string (no data-URL prefix). */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
  });

/** Fetch a remote image URL and return its base64 representation. */
export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Compress an image by resizing and re-encoding as JPEG.
 * Accepts raw base64 (no prefix) and returns raw base64.
 */
export const compressImage = (
  base64: string,
  maxSize = 800,
  quality = 0.8,
): Promise<string> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h / w) * maxSize);
          w = maxSize;
        } else {
          w = Math.round((w / h) * maxSize);
          h = maxSize;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = `data:image/jpeg;base64,${base64}`;
  });

/**
 * Convert a raw base64 string into a Blob with the given MIME type.
 * This utility was previously missing and caused runtime errors.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Generate a VSUAL-branded contact card image with contact details overlaid.
 * Returns a Blob (PNG) suitable for sharing via Web Share API or WhatsApp.
 */
export async function generateContactCardImage(options: {
  selfieBase64?: string | null;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
}): Promise<Blob> {
  const W = 800;
  const H = 500;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background: dark gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(0.5, '#16213e');
  bgGrad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Magenta accent bar at top
  const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  accentGrad.addColorStop(0, '#C00F7A');
  accentGrad.addColorStop(0.5, '#E91E90');
  accentGrad.addColorStop(1, '#FF6B9D');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, W, 5);

  // Left side: Selfie or VSUAL V-logo
  const leftX = 40;
  const photoSize = 160;
  if (options.selfieBase64) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${options.selfieBase64}`;
      });
      // Circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(leftX + photoSize / 2, 80 + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, leftX, 80, photoSize, photoSize);
      ctx.restore();
      // Border ring
      ctx.strokeStyle = '#C00F7A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(leftX + photoSize / 2, 80 + photoSize / 2, photoSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      drawVLogo(ctx, leftX + photoSize / 2, 80 + photoSize / 2, photoSize);
    }
  } else {
    drawVLogo(ctx, leftX + photoSize / 2, 80 + photoSize / 2, photoSize);
  }

  // Right side: Contact info
  const rightX = 240;
  let y = 90;

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText(options.name || 'Unknown', rightX, y);
  y += 36;

  // Title
  if (options.title) {
    ctx.fillStyle = '#FF6B9D';
    ctx.font = '600 18px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText(options.title, rightX, y);
    y += 28;
  }

  // Company
  if (options.company) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '500 17px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText(options.company, rightX, y);
    y += 32;
  }

  // Divider
  y += 8;
  ctx.strokeStyle = 'rgba(192,15,122,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightX, y);
  ctx.lineTo(W - 40, y);
  ctx.stroke();
  y += 24;

  // Contact details with emoji-style icons
  ctx.font = '400 15px system-ui, -apple-system, Arial, sans-serif';
  const details = [
    options.email ? `📧  ${options.email}` : '',
    options.phone ? `📱  ${options.phone}` : '',
    options.address ? `📍  ${options.address}` : '',
  ].filter(Boolean);

  for (const detail of details) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(detail, rightX, y);
    y += 24;
  }

  // Bottom bar: VSUAL branding
  ctx.fillStyle = 'rgba(192,15,122,0.15)';
  ctx.fillRect(0, H - 50, W, 50);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '600 12px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText('VSUAL Digital Media • Promotional Marketing Agency', 40, H - 20);

  ctx.fillStyle = '#C00F7A';
  ctx.font = 'bold 12px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText('⚡ Powered by Z AI', W - 180, H - 20);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
  });
}

function drawVLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const r = size / 2;
  // Circle bg
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, '#E91E90');
  grad.addColorStop(1, '#C00F7A');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // V letter
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r * 0.9)}px system-ui, -apple-system, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', cx, cy + 4);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}
