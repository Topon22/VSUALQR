'use client';

import { useState, useCallback } from 'react';
import {
  Check,
  RefreshCw,
  Share2,
  MessageCircle,
  Database,
  Cloud,
  ExternalLink,
  ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Header } from './header';
import { StatusBadge } from './status-badge';
import { ImageModal } from './image-modal';
import { base64ToBlob } from '@/lib/vsual-utils';
import { WHATSAPP_GROUP_LINK, type AutomationResults, type Contact } from '@/lib/vsual-types';

/**
 * WhatsApp SVG Icon component.
 */
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

interface SuccessScreenProps {
  results: AutomationResults;
  contact: Contact;
  brandedSelfie: string | null;
  cardWatermarked: string | null;
  cardBase64: string | null;
  cardUrl: string | null;
  onReset: () => void;
}

/**
 * Success Screen
 *
 * Shows the automation results and provides opt-in share buttons.
 *
 * FIXES applied:
 * - Removed auto WhatsApp share trigger — now opt-in only
 * - Uses shadcn Card, Badge (via StatusBadge), Button
 * - Uses ImageModal (Dialog-based) instead of raw div overlay
 * - Uses base64ToBlob utility (was previously missing)
 * - Proper aria-labels on all buttons
 */
export function SuccessScreen({
  results,
  contact,
  brandedSelfie,
  cardWatermarked,
  cardBase64,
  cardUrl,
  onReset,
}: SuccessScreenProps) {
  const [imageModal, setImageModal] = useState<{ type: 'card' | 'selfie'; open: boolean }>({
    type: 'card',
    open: false,
  });

  const cardPreviewSrc =
    results.card_drive_url ||
    cardUrl ||
    (cardWatermarked ? `data:image/jpeg;base64,${cardWatermarked}` : cardBase64 ? `data:image/jpeg;base64,${cardBase64}` : null);
  const selfiePreviewSrc =
    results.selfie_drive_url ||
    (brandedSelfie ? `data:image/jpeg;base64,${brandedSelfie}` : null);

  /** Copy text to clipboard with toast feedback. */
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Link copied!'))
      .catch(() => toast.error('Failed to copy'));
  }, []);

  /** Build WhatsApp-formatted text for sharing. */
  const buildWhatsAppText = useCallback(() => {
    const lines = [`*📋 New Contact: ${contact.name || 'N/A'}*`];
    if (contact.company) lines.push(`🏢 Company: ${contact.company}`);
    if (contact.title) lines.push(`💼 Title: ${contact.title}`);
    if (contact.email) lines.push(`📧 Email: ${contact.email}`);
    if (contact.phone) lines.push(`📱 Phone: ${contact.phone}`);
    if (contact.address) lines.push(`📍 Address: ${contact.address}`);
    lines.push('');
    lines.push('Status:');
    if (results.db_status === 'success') lines.push('✅ Saved to Database');
    lines.push('');
    lines.push('_VSUAL Networking App_');
    return lines.join('\n');
  }, [contact, results]);

  /** Opt-in: Share via Web Share API (with files) or WhatsApp URL. */
  const shareToWhatsApp = useCallback(() => {
    const text = buildWhatsAppText();

    // Try Web Share API first (mobile — supports file attachments)
    if (navigator.share && brandedSelfie) {
      try {
        const selfieBlob = base64ToBlob(brandedSelfie, 'image/jpeg');
        const files: File[] = [new File([selfieBlob], 'vsual-selfie.jpg', { type: 'image/jpeg' })];

        if (cardWatermarked || cardBase64) {
          const cardBlob = base64ToBlob(cardWatermarked || cardBase64!, 'image/jpeg');
          files.push(new File([cardBlob], 'vsual-card.jpg', { type: 'image/jpeg' }));
        }

        navigator
          .share({
            title: `New Contact: ${contact.name}`,
            text,
            files,
          })
          .catch(() => {
            // Fallback without files
            navigator
              .share({
                title: `New Contact: ${contact.name}`,
                text,
              })
              .catch(() => {
                /* User cancelled */
              });
          });
        return;
      } catch {
        // Fallback to URL
      }
    }

    // Fallback: WhatsApp URL
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [buildWhatsAppText, contact.name, brandedSelfie, cardWatermarked, cardBase64]);

  /** Open the VSUAL WhatsApp group. */
  const openWhatsAppGroup = useCallback(() => {
    window.open(WHATSAPP_GROUP_LINK, '_blank');
  }, []);

  /** General share (Web Share API or clipboard). */
  const shareGeneral = useCallback(async () => {
    const text = `New Contact Captured: ${contact.name}${contact.company ? ' from ' + contact.company : ''}${contact.email ? ' (' + contact.email + ')' : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VSUAL Contact', text });
        return;
      } catch {
        /* User cancelled */
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success('Contact info copied to clipboard!');
  }, [contact]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] px-4 sm:px-6 gap-4 sm:gap-5 screen-fade-in">
      <Header />

      {/* Success check icon */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C00F7A]/10 flex items-center justify-center screen-slide-up">
        <Check strokeWidth={1.5} className="w-8 h-8 sm:w-10 sm:h-10 text-[#C00F7A]" />
      </div>

      <div className="text-center px-4">
        <h2 className="text-xl sm:text-2xl tracking-tight font-medium text-black mb-2">All Done!</h2>
        <p className="text-sm sm:text-base leading-relaxed text-[#86868B]">{results.message}</p>
      </div>

      {/* Captured Images Summary */}
      {(selfiePreviewSrc || cardPreviewSrc) && (
        <div className="flex gap-3 justify-center">
          {selfiePreviewSrc && (
            <button
              onClick={() => setImageModal({ type: 'selfie', open: true })}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm active:scale-95 transition-transform"
              aria-label="View selfie full size"
            >
              <img src={selfiePreviewSrc} alt="Selfie" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                <p className="text-[9px] text-white font-medium">Selfie</p>
              </div>
              {results.selfie_drive_url && (
                <div className="absolute top-1 left-1">
                  <Cloud className="w-3 h-3 text-[#34C759]" fill="currentColor" />
                </div>
              )}
            </button>
          )}
          {cardPreviewSrc && (
            <button
              onClick={() => setImageModal({ type: 'card', open: true })}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm active:scale-95 transition-transform"
              aria-label="View business card full size"
            >
              <img src={cardPreviewSrc} alt="Business Card" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                <p className="text-[9px] text-white font-medium">Card</p>
              </div>
              {results.card_drive_url && (
                <div className="absolute top-1 left-1">
                  <Cloud className="w-3 h-3 text-[#34C759]" fill="currentColor" />
                </div>
              )}
            </button>
          )}
        </div>
      )}

      {/* Image Preview Modal (using Dialog) */}
      <ImageModal
        open={imageModal.open}
        onOpenChange={(open) => setImageModal({ type: imageModal.type, open })}
        imageSrc={imageModal.type === 'card' ? cardPreviewSrc : selfiePreviewSrc}
        imageAlt={imageModal.type === 'card' ? 'Business Card' : 'Selfie'}
        driveUrl={
          imageModal.type === 'card'
            ? results.card_drive_url ?? null
            : results.selfie_drive_url ?? null
        }
      />

      {/* Automation Status */}
      <Card className="p-4 sm:p-5 w-full max-w-sm bg-white/70 backdrop-blur-xl border-white/40 shadow-sm">
        <CardContent className="p-0 space-y-3">
          <p className="text-xs font-medium text-[#86868B] uppercase tracking-wider mb-2">Automation Status</p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#86868B] flex items-center gap-2">
              <Database strokeWidth={1.25} className="w-4 h-4" /> Database
            </span>
            <StatusBadge status={results.db_status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#86868B] flex items-center gap-2">
              <Cloud strokeWidth={1.25} className="w-4 h-4" /> Cloud Storage
            </span>
            <StatusBadge status={results.drive_status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#86868B] flex items-center gap-2">
              <WhatsAppIcon /> WhatsApp Group
            </span>
            <StatusBadge status={results.whatsapp_status} />
          </div>
        </CardContent>
      </Card>

      {/* Cloud Storage Preview Links */}
      {(results.card_drive_url || results.selfie_drive_url) && (
        <Card className="p-4 sm:p-5 w-full max-w-sm bg-white/70 backdrop-blur-xl border-white/40 shadow-sm">
          <CardContent className="p-0 space-y-2.5">
            <p className="text-xs font-medium text-[#86868B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cloud strokeWidth={1.25} className="w-3.5 h-3.5 text-[#34C759]" />
              Uploaded to Cloud Storage
            </p>

            {results.card_drive_url && (
              <div className="space-y-1">
                <p className="text-[11px] text-[#86868B] font-medium">Business Card Preview Link:</p>
                <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
                  <ImageIcon strokeWidth={1.25} className="w-3.5 h-3.5 text-[#C00F7A] shrink-0" />
                  <p className="text-[11px] text-[#1D1D1F] truncate flex-1">{results.card_drive_url}</p>
                  <button
                    onClick={() => copyToClipboard(results.card_drive_url!)}
                    className="text-[#C00F7A] hover:text-[#9A0C62] transition-colors shrink-0 active:scale-90"
                    title="Copy link"
                    aria-label="Copy card link"
                  >
                    <LinkIcon strokeWidth={1.25} className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={results.card_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C00F7A] hover:text-[#9A0C62] transition-colors shrink-0"
                    title="Open in new tab"
                    aria-label="Open card in new tab"
                  >
                    <ExternalLink strokeWidth={1.25} className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {results.selfie_drive_url && (
              <div className="space-y-1">
                <p className="text-[11px] text-[#86868B] font-medium">Selfie Preview Link:</p>
                <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
                  <ImageIcon strokeWidth={1.25} className="w-3.5 h-3.5 text-[#C00F7A] shrink-0" />
                  <p className="text-[11px] text-[#1D1D1F] truncate flex-1">{results.selfie_drive_url}</p>
                  <button
                    onClick={() => copyToClipboard(results.selfie_drive_url!)}
                    className="text-[#C00F7A] hover:text-[#9A0C62] transition-colors shrink-0 active:scale-90"
                    title="Copy link"
                    aria-label="Copy selfie link"
                  >
                    <LinkIcon strokeWidth={1.25} className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={results.selfie_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C00F7A] hover:text-[#9A0C62] transition-colors shrink-0"
                    title="Open in new tab"
                    aria-label="Open selfie in new tab"
                  >
                    <ExternalLink strokeWidth={1.25} className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Opt-in Share Buttons (NOT auto-triggering) */}
      <div className="w-full max-w-sm space-y-2">
        <Button
          onClick={shareToWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{ backgroundColor: '#25D366', color: 'white' }}
          aria-label="Share contact to WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5" />
          Share Contact to WhatsApp
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={openWhatsAppGroup}
            variant="outline"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            aria-label="Open WhatsApp group"
          >
            <MessageCircle strokeWidth={1.25} className="w-4 h-4" />
            WhatsApp Group
          </Button>
          <Button
            onClick={shareGeneral}
            variant="outline"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            aria-label="Share contact via general share"
          >
            <Share2 strokeWidth={1.25} className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      <Button
        onClick={onReset}
        className="mt-2 bg-[#C00F7A] hover:bg-[#9A0C62] text-white rounded-xl py-3 px-6 font-medium tracking-tight shadow-sm active:scale-95 transition-all"
        aria-label="Start a new capture"
      >
        <RefreshCw strokeWidth={1.5} className="w-4 h-4 mr-2" />
        New Capture
      </Button>
    </div>
  );
}
