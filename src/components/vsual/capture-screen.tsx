'use client';

import { useState, useRef, useCallback } from 'react';
import {
  CreditCard,
  Camera,
  Loader2,
  Check,
  ArrowRight,
  X,
  Link,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Header } from './header';
import type { Contact } from '@/lib/vsual-types';

/**
 * Capture Screen
 *
 * Allows the user to:
 * 1. Take a selfie (with front camera) → watermarked automatically
 * 2. Scan a business card (with rear camera) → OCR'd automatically
 * 3. Optionally paste a card URL
 *
 * FIXES applied:
 * - Uses shadcn Card + Button instead of custom GlassCard/PrimaryButton
 * - Proper aria-labels on all interactive elements
 * - Keyboard-accessible URL submit (Enter key)
 */

interface CaptureScreenProps {
  brandedSelfie: string | null;
  cardBase64: string | null;
  cardWatermarked: string | null;
  cardUrl: string | null;
  contact: Contact;
  onCardCapture: (file: File) => void;
  onSelfieCapture: (file: File) => void;
  onRemoveSelfie: () => void;
  onRemoveCard: () => void;
  onCardUrlSubmit: (url: string) => void;
  onContinue: () => void;
}

export function CaptureScreen({
  brandedSelfie,
  cardBase64,
  cardWatermarked,
  cardUrl,
  contact,
  onCardCapture,
  onSelfieCapture,
  onRemoveSelfie,
  onRemoveCard,
  onCardUrlSubmit,
  onContinue,
}: CaptureScreenProps) {
  const cardInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const hasSelfie = !!brandedSelfie;
  const hasCard = !!cardBase64;
  const canContinue = hasSelfie || hasCard;

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid URL');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    setUrlLoading(true);
    onCardUrlSubmit(trimmed);
    setUrlLoading(false);
  }, [urlInput, onCardUrlSubmit]);

  return (
    <div className="flex flex-col min-h-[80vh] px-4 sm:px-6 gap-4 sm:gap-5 screen-fade-in">
      <Header />

      {/* Title */}
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl tracking-tighter font-semibold text-black mb-1.5">
          Instant Authority
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-[#86868B]">
          Capture card &amp; selfie, then review &amp; save
        </p>
      </div>

      {/* Previews Section */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
        {/* Selfie Preview */}
        {hasSelfie ? (
          <div className="relative rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm">
            <img
              src={`data:image/jpeg;base64,${brandedSelfie}`}
              alt="Branded selfie preview"
              className="w-full h-32 sm:h-40 object-cover"
            />
            <button
              onClick={onRemoveSelfie}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center active:scale-90"
              aria-label="Remove selfie"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
              <p className="text-[10px] text-white font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Selfie captured
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => selfieInputRef.current?.click()}
            className="bg-[#C00F7A] text-white rounded-xl py-5 sm:py-7 px-4 sm:px-6 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-[#9A0C62] transition-all shadow-[0_4px_16px_rgba(192,15,122,0.3)] active:scale-95 border-2 border-[#C00F7A]"
            aria-label="Take a selfie"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Camera strokeWidth={1.25} className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-medium tracking-tight">Take Selfie</span>
          </button>
        )}

        {/* Card Preview */}
        {hasCard ? (
          <div className="relative rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm">
            <img
              src={cardWatermarked ? `data:image/jpeg;base64,${cardWatermarked}` : cardUrl || `data:image/jpeg;base64,${cardBase64}`}
              alt="Business card preview"
              className="w-full h-32 sm:h-40 object-cover"
            />
            <button
              onClick={onRemoveCard}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center active:scale-90"
              aria-label="Remove business card"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
              <p className="text-[10px] text-white font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> {cardUrl ? 'Card loaded' : 'Card scanned'}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => cardInputRef.current?.click()}
            className="bg-white/60 backdrop-blur-xl border-2 border-[#C00F7A] text-[#1D1D1F] rounded-xl py-5 sm:py-7 px-4 sm:px-6 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-[#C00F7A]/10 transition-all shadow-[0_4px_16px_rgba(192,15,122,0.1)] active:scale-95"
            aria-label="Scan a business card"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#C00F7A]/10 flex items-center justify-center">
              <CreditCard strokeWidth={1.25} className="w-5 h-5 sm:w-6 sm:h-6 text-[#C00F7A]" />
            </div>
            <span className="text-xs sm:text-sm font-medium tracking-tight">Scan Card</span>
          </button>
        )}

        {/* Hidden file inputs */}
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          aria-label="Capture selfie"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelfieCapture(file);
            e.target.value = '';
          }}
        />
        <input
          ref={cardInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          aria-label="Capture business card"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCardCapture(file);
            e.target.value = '';
          }}
        />

        {/* Paste Card URL */}
        {!hasCard && (
          <div className="col-span-2">
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="w-full text-xs text-center text-[#86868B] hover:text-[#C00F7A] transition-colors py-1 flex items-center justify-center gap-1"
              aria-label="Toggle card URL input"
              aria-expanded={showUrlInput}
            >
              <Link strokeWidth={1.25} className="w-3 h-3" />
              or paste card URL
            </button>
            {showUrlInput && (
              <div className="mt-2 flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/card.jpg"
                  className="flex-1 bg-white/50 backdrop-blur-md border-gray-200/50 text-xs"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit(); }}
                  aria-label="Card image URL"
                />
                <Button
                  onClick={handleUrlSubmit}
                  disabled={urlLoading}
                  size="sm"
                  className="bg-[#C00F7A] hover:bg-[#9A0C62] text-white text-xs shrink-0"
                  aria-label="Load card from URL"
                >
                  {urlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Load'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OCR Extracted Data Preview */}
      {hasCard && (contact.name || contact.email || contact.company) && (
        <Card className="p-3 sm:p-4 w-full max-w-md mx-auto bg-white/70 backdrop-blur-xl border-white/40 shadow-sm">
          <CardContent className="p-0">
            <p className="text-[10px] uppercase tracking-wider text-[#86868B] font-medium mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> AI Extracted from Card
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {contact.name && (
                <p className="text-sm text-[#1D1D1F]"><span className="text-[#86868B]">Name:</span> {contact.name}</p>
              )}
              {contact.company && (
                <p className="text-sm text-[#1D1D1F]"><span className="text-[#86868B]">Company:</span> {contact.company}</p>
              )}
              {contact.title && (
                <p className="text-sm text-[#1D1D1F]"><span className="text-[#86868B]">Title:</span> {contact.title}</p>
              )}
              {contact.email && (
                <p className="text-sm text-[#1D1D1F]"><span className="text-[#86868B]">Email:</span> {contact.email}</p>
              )}
              {contact.phone && (
                <p className="text-sm text-[#1D1D1F]"><span className="text-[#86868B]">Phone:</span> {contact.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capture count indicator */}
      <div className="flex items-center justify-center gap-3 text-xs text-[#86868B] w-full max-w-md mx-auto" role="status" aria-live="polite">
        <span className={`flex items-center gap-1 ${hasSelfie ? 'text-[#C00F7A] font-medium' : ''}`}>
          <Camera className="w-3.5 h-3.5" /> Selfie {hasSelfie ? '✓' : ''}
        </span>
        <span className="text-gray-300" aria-hidden="true">|</span>
        <span className={`flex items-center gap-1 ${hasCard ? 'text-[#C00F7A] font-medium' : ''}`}>
          <CreditCard className="w-3.5 h-3.5" /> Card {hasCard ? '✓' : ''}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue Button */}
      <div className="w-full max-w-md mx-auto pb-6 sm:pb-8 space-y-2">
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full bg-[#C00F7A] hover:bg-[#9A0C62] text-white rounded-xl py-3 px-6 font-medium tracking-tight shadow-sm active:scale-95 transition-all"
          aria-label="Continue to review and save"
        >
          <ArrowRight strokeWidth={1.5} className="w-4 h-4 mr-2" />
          {hasCard && hasSelfie ? 'Review & Save Contact' : 'Fill Details & Save'}
        </Button>
        {!canContinue && (
          <p className="text-center text-xs text-[#86868B]" role="alert">
            Capture a selfie or scan a card to continue
          </p>
        )}
      </div>
    </div>
  );
}
