'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  CreditCard,
  Camera,
  Loader2,
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Send,
  Check,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Home as HomeIcon,
  MessageCircle,
  Zap,
  Database,
  Share2,
  X,
  Link,
  Cloud,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== CONSTANTS ====================
const MAGENTA = '#C00F7A';
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Hn4Ox86GwWz0Wp1oDQ6aA0';

// ==================== TYPES ====================
interface Contact {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
}

interface AutomationResults {
  success: boolean;
  message: string;
  ghl_status: 'success' | 'skipped' | 'error' | 'unknown' | 'tracked';
  drive_status: 'success' | 'skipped' | 'error' | 'unknown';
  db_status: 'success' | 'skipped' | 'error' | 'unknown';
  whatsapp_status: 'success' | 'skipped' | 'error' | 'unknown';
  selfie_drive_url?: string;
  card_drive_url?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AppStep = 'capture' | 'analyzing' | 'form' | 'automating' | 'success';
type AppMode = 'networking' | 'chat';

// ==================== UTILITY: fileToBase64 ====================
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      const data = base64.split(',')[1];
      resolve(data);
    };
    reader.onerror = reject;
  });
};

// ==================== UTILITY: urlToBase64 ====================
const urlToBase64 = async (url: string): Promise<string> => {
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

// ==================== UTILITY: compressImage ====================
const compressImage = (base64: string, maxSize = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round((h / w) * maxSize); w = maxSize; }
        else { w = Math.round((w / h) * maxSize); h = maxSize; }
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
};

// ==================== REUSABLE COMPONENTS ====================

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

function GlassInput({
  label,
  icon: Icon,
  ...props
}: { label?: string; icon?: React.ComponentType<{ strokeWidth?: number; className?: string }> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
          {Icon && <Icon strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />}
          {label}
        </label>
      )}
      <input
        className="w-full bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-xl px-4 py-3 text-base text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50 transition-all"
        {...props}
      />
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  className = '',
  ...props
}: { children: React.ReactNode; loading?: boolean; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`bg-[#C00F7A] text-white rounded-xl py-3 px-6 font-medium tracking-tight hover:bg-[#9A0C62] transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: 'success' | 'skipped' | 'error' | 'unknown' | 'tracked' }) {
  const config = {
    success: { bg: 'bg-[#34C759]/10', text: 'text-[#34C759]', label: 'Sent' },
    tracked: { bg: 'bg-[#007AFF]/10', text: 'text-[#007AFF]', label: 'Tracked' },
    skipped: { bg: 'bg-[#FF9500]/10', text: 'text-[#FF9500]', label: 'Skipped' },
    error: { bg: 'bg-[#FF3B30]/10', text: 'text-[#FF3B30]', label: 'Error' },
    unknown: { bg: 'bg-[#86868B]/10', text: 'text-[#86868B]', label: 'Unknown' },
  };
  const cfg = config[status] || config.unknown;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function AppleSpinner({ text = 'Analyzing...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12">
      <div className="relative w-14 h-14">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: MAGENTA,
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 30}deg) translateY(-20px)`,
              opacity: 1 - i * 0.07,
              animation: 'spinFade 1s linear infinite',
              animationDelay: `${i * 0.083}s`,
            }}
          />
        ))}
      </div>
      <p className="text-base font-medium text-[#1D1D1F] tracking-tight">{text}</p>
      <p className="text-xs text-[#86868B]">AI-powered extraction in progress</p>
    </div>
  );
}

// ==================== HEADER ====================

function Header() {
  return (
    <div className="flex flex-col items-center pt-6 sm:pt-8 pb-3 sm:pb-4">
      <p className="text-[13px] sm:text-[14px] text-[#777777] font-normal uppercase tracking-tight text-center"
        style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
      >
        VSUALDIGITALMEDIA
      </p>
      <p className="text-[9px] sm:text-[10px] text-[#777777] font-normal uppercase mt-0.5 text-center"
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          letterSpacing: '4px',
        }}
      >
        PROMOTIONAL MARKETING AGENCY
      </p>
    </div>
  );
}

// ==================== SPLASH SCREEN (Device-optimized video) ====================

function useDeviceType() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });
  return device;
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'playing' | 'blocked'>('loading');
  const [videoProgress, setVideoProgress] = useState(0);
  const completedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const device = useDeviceType();

  const videoSrc = device === 'mobile' ? '/red-720p.mp4' : '/red-720p.mp4';

  const triggerComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      setFading(true);
      setTimeout(onComplete, 500);
    }
  }, [onComplete]);

  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (vid && vid.duration > 0) {
      setVideoProgress((vid.currentTime / vid.duration) * 100);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    triggerComplete();
  }, [triggerComplete]);

  const handleTap = useCallback(() => {
    if (phase === 'blocked') {
      const vid = videoRef.current;
      if (vid) {
        vid.play().then(() => setPhase('playing')).catch(() => triggerComplete());
      }
      return;
    }
    triggerComplete();
  }, [phase, triggerComplete]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onLoaded = () => {
      setPhase('ready');
      vid.play().then(() => {
        setPhase('playing');
      }).catch(() => {
        setPhase('blocked');
      });
    };
    vid.addEventListener('loadeddata', onLoaded);

    return () => vid.removeEventListener('loadeddata', onLoaded);
  }, [videoSrc]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completedRef.current) triggerComplete();
    }, 6000);
    return () => clearTimeout(timer);
  }, [triggerComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        triggerComplete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerComplete]);

  return (
    <div
      className={`splash-container ${fading ? 'splash-exit' : ''}`}
      onClick={handleTap}
      style={{ touchAction: 'manipulation', cursor: 'pointer' }}
      role="dialog"
      aria-label="Loading VSUAL"
    >
      {/* Poster image shown instantly while video loads */}
      <img
        src="/red-poster.jpg"
        alt=""
        className={`splash-poster ${phase !== 'loading' ? 'splash-poster-hidden' : ''}`}
        aria-hidden="true"
      />

      {/* Video element */}
      <video
        ref={videoRef}
        className={`splash-video ${phase !== 'loading' ? 'splash-video-visible' : ''}`}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/red-poster.jpg"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
      />

      {/* Phase 1: Loading spinner */}
      {phase === 'loading' && (
        <div className="splash-loader">
          <div className="splash-loader-ring" />
          <p className="splash-loader-text">Loading</p>
        </div>
      )}

      {/* Phase 2: Autoplay blocked (iOS Safari) */}
      {phase === 'blocked' && (
        <div className="splash-tap-overlay">
          <div className="splash-play-btn">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
          <p className="text-white/90 text-sm font-medium mt-3">Tap to Continue</p>
        </div>
      )}

      {/* Phase 3: Playing - progress bar + skip hint */}
      {phase === 'playing' && !fading && (
        <div className="splash-bottom-bar">
          <div className="splash-progress-track">
            <div
              className="splash-progress-fill"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
          <p className="splash-skip-hint">
            Skip <span className="splash-skip-hint-sep" aria-hidden="true">·</span> Tap anywhere
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== CAPTURE SCREEN ====================

function CaptureScreen({
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
}: {
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
}) {
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
          Capture card & selfie, then review & save
        </p>
      </div>

      {/* Previews Section */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
        {/* Selfie Preview */}
        {hasSelfie ? (
          <div className="relative rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm">
            <img
              src={`data:image/jpeg;base64,${brandedSelfie}`}
              alt="Branded Selfie"
              className="w-full h-32 sm:h-40 object-cover"
            />
            <button
              onClick={onRemoveSelfie}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center active:scale-90"
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
              alt="Business Card"
              className="w-full h-32 sm:h-40 object-cover"
            />
            <button
              onClick={onRemoveCard}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center active:scale-90"
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
            >
              <Link strokeWidth={1.25} className="w-3 h-3" />
              or paste card URL
            </button>
            {showUrlInput && (
              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/card.jpg"
                  className="flex-1 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50 transition-all"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit(); }}
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={urlLoading}
                  className="bg-[#C00F7A] text-white rounded-xl px-3 py-2 text-xs font-medium hover:bg-[#9A0C62] transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1"
                >
                  {urlLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Load
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OCR Extracted Data Preview */}
      {hasCard && (contact.name || contact.email || contact.company) && (
        <GlassCard className="p-3 sm:p-4 w-full max-w-md mx-auto">
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
        </GlassCard>
      )}

      {/* Capture count indicator */}
      <div className="flex items-center justify-center gap-3 text-xs text-[#86868B] w-full max-w-md mx-auto">
        <span className={`flex items-center gap-1 ${hasSelfie ? 'text-[#C00F7A] font-medium' : ''}`}>
          <Camera className="w-3.5 h-3.5" /> Selfie {hasSelfie ? '✓' : ''}
        </span>
        <span className="text-gray-300">|</span>
        <span className={`flex items-center gap-1 ${hasCard ? 'text-[#C00F7A] font-medium' : ''}`}>
          <CreditCard className="w-3.5 h-3.5" /> Card {hasCard ? '✓' : ''}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue Button */}
      <div className="w-full max-w-md mx-auto pb-6 sm:pb-8 space-y-2">
        <PrimaryButton
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full"
        >
          <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
          {hasCard && hasSelfie ? 'Review & Save Contact' :
           hasCard ? 'Fill Details & Save' :
           'Fill Details & Save'}
        </PrimaryButton>
        {!canContinue && (
          <p className="text-center text-xs text-[#86868B]">
            Capture a selfie or scan a card to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ==================== CONTACT FORM ====================

function ContactFormScreen({
  contact,
  setContact,
  brandedSelfie,
  cardWatermarked,
  cardBase64,
  cardUrl,
  onSubmit,
  onBack,
  onRescan,
  onRetakeSelfie,
  loading,
}: {
  contact: Contact;
  setContact: React.Dispatch<React.SetStateAction<Contact>>;
  brandedSelfie: string | null;
  cardWatermarked: string | null;
  cardBase64: string | null;
  cardUrl: string | null;
  onSubmit: () => void;
  onBack: () => void;
  onRescan: () => void;
  onRetakeSelfie: () => void;
  loading: boolean;
}) {
  return (
    <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-5 screen-fade-in">
      <Header />

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 backdrop-blur-xl border border-[#C00F7A]/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft strokeWidth={1.25} className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D1D1F]" />
        </button>
        <h2 className="text-xl sm:text-2xl tracking-tight font-medium text-black">Review & Save</h2>
      </div>

      {/* Captured Images Preview */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Branded Selfie Preview */}
        {brandedSelfie ? (
          <GlassCard className="p-2">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={`data:image/jpeg;base64,${brandedSelfie}`}
                alt="Branded Selfie"
                className="w-full h-32 sm:h-40 object-cover"
              />
              <div className="absolute top-1.5 right-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-[#C00F7A] text-white text-[9px] font-medium">Watermarked</span>
              </div>
            </div>
            <button
              onClick={onRetakeSelfie}
              className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-[#C00F7A] hover:text-[#9A0C62] transition-colors active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              <Camera className="w-3 h-3" /> Re-take
            </button>
          </GlassCard>
        ) : (
          <button
            onClick={onRetakeSelfie}
            className="rounded-xl border-2 border-dashed border-gray-200 py-5 flex flex-col items-center justify-center gap-2 text-[#86868B] hover:border-[#C00F7A]/50 hover:text-[#C00F7A] transition-all active:scale-95"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs font-medium">Add Selfie</span>
          </button>
        )}

        {/* Business Card Preview */}
        {cardBase64 ? (
          <GlassCard className="p-2">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={cardWatermarked ? `data:image/jpeg;base64,${cardWatermarked}` : cardUrl || `data:image/jpeg;base64,${cardBase64}`}
                alt="Business Card"
                className="w-full h-32 sm:h-40 object-cover"
              />
              <div className="absolute top-1.5 right-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-[#C00F7A] text-white text-[9px] font-medium">Watermarked</span>
              </div>
            </div>
            <button
              onClick={onRescan}
              className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-[#C00F7A] hover:text-[#9A0C62] transition-colors active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              <RefreshCw className="w-3 h-3" /> Re-scan
            </button>
          </GlassCard>
        ) : (
          <button
            onClick={onRescan}
            className="rounded-xl border-2 border-dashed border-gray-200 py-5 flex flex-col items-center justify-center gap-2 text-[#86868B] hover:border-[#C00F7A]/50 hover:text-[#C00F7A] transition-all active:scale-95"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Scan Card</span>
          </button>
        )}
      </div>

      {/* Contact Form Fields */}
      <GlassCard className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        <p className="text-xs font-medium text-[#86868B] uppercase tracking-wider mb-1">Contact Details</p>
        <GlassInput
          label="Name"
          icon={User}
          placeholder="John Doe"
          value={contact.name}
          onChange={(e) => setContact({ ...contact, name: e.target.value })}
        />
        <GlassInput
          label="Company"
          icon={Building2}
          placeholder="Acme Corp"
          value={contact.company}
          onChange={(e) => setContact({ ...contact, company: e.target.value })}
        />
        <GlassInput
          label="Title"
          icon={Briefcase}
          placeholder="Sales Director"
          value={contact.title}
          onChange={(e) => setContact({ ...contact, title: e.target.value })}
        />
        <GlassInput
          label="Email"
          icon={Mail}
          type="email"
          placeholder="john@acme.com"
          value={contact.email}
          onChange={(e) => setContact({ ...contact, email: e.target.value })}
        />
        <GlassInput
          label="Phone"
          icon={Phone}
          type="tel"
          placeholder="+1 555 123 4567"
          value={contact.phone}
          onChange={(e) => setContact({ ...contact, phone: e.target.value })}
        />
        <GlassInput
          label="Address (Optional)"
          icon={MapPin}
          placeholder="123 Main St, City, State"
          value={contact.address}
          onChange={(e) => setContact({ ...contact, address: e.target.value })}
        />
      </GlassCard>

      <div className="space-y-3 pb-6 sm:pb-8">
        <PrimaryButton onClick={onSubmit} loading={loading} className="w-full">
          <Check strokeWidth={1.5} className="w-4 h-4" />
          Confirm & Save
        </PrimaryButton>

        <div className="flex items-center justify-center gap-3 text-xs text-[#86868B]">
          <span className="flex items-center gap-1"><Database strokeWidth={1.25} className="w-3.5 h-3.5" /> DB</span>
          <span className="flex items-center gap-1"><MessageCircle strokeWidth={1.25} className="w-3.5 h-3.5" /> WhatsApp</span>
        </div>
      </div>
    </div>
  );
}

// ==================== WHATSAPP ICON ====================

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ==================== HELPER: base64ToBlob ====================
function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

// ==================== SUCCESS SCREEN ====================

function SuccessScreen({
  results,
  contact,
  brandedSelfie,
  cardWatermarked,
  cardBase64,
  cardUrl,
  onReset,
}: {
  results: AutomationResults;
  contact: Contact;
  brandedSelfie: string | null;
  cardWatermarked: string | null;
  cardBase64: string | null;
  cardUrl: string | null;
  onReset: () => void;
}) {
  const [imageModal, setImageModal] = useState<{type: 'card' | 'selfie'; open: boolean}>({type: 'card', open: false});

  const cardPreviewSrc = results.card_drive_url
    || cardUrl
    || (cardWatermarked ? `data:image/jpeg;base64,${cardWatermarked}` : cardBase64 ? `data:image/jpeg;base64,${cardBase64}` : null);
  const selfiePreviewSrc = results.selfie_drive_url
    || (brandedSelfie ? `data:image/jpeg;base64,${brandedSelfie}` : null);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, []);

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

  const tryAutoShareWhatsApp = useCallback(() => {
    const text = buildWhatsAppText();

    // Try Web Share API first (mobile)
    if (navigator.share && brandedSelfie) {
      try {
        const selfieBlob = base64ToBlob(brandedSelfie, 'image/jpeg');
        const files: File[] = [new File([selfieBlob], 'vsual-selfie.jpg', { type: 'image/jpeg' })];

        if (cardWatermarked || cardBase64) {
          const cardBlob = base64ToBlob(cardWatermarked || cardBase64!, 'image/jpeg');
          files.push(new File([cardBlob], 'vsual-card.jpg', { type: 'image/jpeg' }));
        }

        navigator.share({
          title: `New Contact: ${contact.name}`,
          text,
          files,
        }).catch(() => {
          navigator.share({
            title: `New Contact: ${contact.name}`,
            text,
          }).catch(() => {
            // User cancelled
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

  const shareToWhatsApp = useCallback(() => {
    tryAutoShareWhatsApp();
  }, [tryAutoShareWhatsApp]);

  const openWhatsAppGroup = useCallback(() => {
    window.open(WHATSAPP_GROUP_LINK, '_blank');
  }, []);

  const shareGeneral = useCallback(async () => {
    const text = `New Contact Captured: ${contact.name}${contact.company ? ' from ' + contact.company : ''}${contact.email ? ' (' + contact.email + ')' : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VSUAL Contact', text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    toast.success('Contact info copied to clipboard!');
  }, [contact]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] px-4 sm:px-6 gap-4 sm:gap-5 screen-fade-in">
      <Header />

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
              onClick={() => setImageModal({type: 'selfie', open: true})}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm active:scale-95 transition-transform"
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
              onClick={() => setImageModal({type: 'card', open: true})}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-[#C00F7A]/30 shadow-sm active:scale-95 transition-transform"
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

      {/* Image Preview Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setImageModal({type: 'card', open: false})}>
          <div className="relative max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setImageModal({type: 'card', open: false})} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center z-10 active:scale-90">
              <X className="w-4 h-4 text-black" />
            </button>
            <img
              src={imageModal.type === 'card' ? cardPreviewSrc : selfiePreviewSrc}
              alt={imageModal.type === 'card' ? 'Business Card' : 'Selfie'}
              className="max-w-full max-h-[75vh] rounded-xl shadow-2xl object-contain"
            />
            {(imageModal.type === 'card' && results.card_drive_url) && (
              <div className="mt-3 flex items-center gap-2 justify-center">
                <Cloud className="w-3.5 h-3.5 text-[#34C759]" />
                <a href={results.card_drive_url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/80 hover:text-white underline truncate max-w-[250px]">{results.card_drive_url.split('/').pop()}</a>
              </div>
            )}
            {(imageModal.type === 'selfie' && results.selfie_drive_url) && (
              <div className="mt-3 flex items-center gap-2 justify-center">
                <Cloud className="w-3.5 h-3.5 text-[#34C759]" />
                <a href={results.selfie_drive_url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/80 hover:text-white underline truncate max-w-[250px]">{results.selfie_drive_url.split('/').pop()}</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Automation Status */}
      <GlassCard className="p-4 sm:p-5 w-full max-w-sm space-y-3">
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
      </GlassCard>

      {/* Cloud Storage Preview Links */}
      {(results.card_drive_url || results.selfie_drive_url) && (
        <GlassCard className="p-4 sm:p-5 w-full max-w-sm space-y-2.5">
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
                >
                  <Link strokeWidth={1.25} className="w-3.5 h-3.5" />
                </button>
                <a
                  href={results.card_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C00F7A] hover:text-[#9A0C62] transition-colors shrink-0"
                  title="Open in new tab"
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
                >
                  <Link strokeWidth={1.25} className="w-3.5 h-3.5" />
                </button>
                <a
                  href={results.selfie_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C00F7A] hover:text-[#9A0C62] transition-colors shrink-0"
                  title="Open in new tab"
                >
                  <ExternalLink strokeWidth={1.25} className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* WhatsApp + Share buttons */}
      <div className="w-full max-w-sm space-y-2">
        <button
          onClick={shareToWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{ backgroundColor: '#25D366', color: 'white' }}
        >
          <WhatsAppIcon className="w-5 h-5" />
          Share Contact to WhatsApp
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={openWhatsAppGroup}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <MessageCircle strokeWidth={1.25} className="w-4 h-4" />
            WhatsApp Group
          </button>
          <button
            onClick={shareGeneral}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <Share2 strokeWidth={1.25} className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <PrimaryButton onClick={onReset} className="mt-2">
        <RefreshCw strokeWidth={1.5} className="w-4 h-4" />
        New Capture
      </PrimaryButton>
    </div>
  );
}

// ==================== AGENT CHAT ====================

function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your VSUAL Assistant. I can help you with networking strategies, marketing campaigns, brand growth, and more. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter((m) => m.id !== 'welcome')
            .concat(userMsg)
            .map((m) => ({ role: m.role, content: m.content })),
          session_id: sessionIdRef.current,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 vsual-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} screen-slide-up`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#C00F7A] text-white rounded-br-md'
                  : 'glass-card text-[#1D1D1F] rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C00F7A] typewriter-dot" />
                <span className="w-2 h-2 rounded-full bg-[#C00F7A] typewriter-dot" />
                <span className="w-2 h-2 rounded-full bg-[#C00F7A] typewriter-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 sm:px-4 pb-4 sm:pb-6 pt-3">
        <div className="glass-card flex items-center gap-3 px-3 sm:px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask VSUAL Assistant..."
            className="flex-1 bg-transparent text-[#1D1D1F] text-sm sm:text-base placeholder:text-[#86868B] focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#C00F7A] text-white flex items-center justify-center hover:bg-[#9A0C62] transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 shrink-0"
          >
            <Send strokeWidth={1.25} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MODE TOGGLE ====================

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}) {
  return (
    <div className="glass-card mx-3 sm:mx-4 mt-3 sm:mt-4 p-1 flex items-center gap-1">
      <button
        onClick={() => onModeChange('networking')}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium tracking-tight transition-all ${
          mode === 'networking'
            ? 'bg-[#C00F7A] text-white shadow-sm'
            : 'text-[#86868B] hover:text-[#1D1D1F]'
        }`}
      >
        <HomeIcon strokeWidth={1.25} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Capture
      </button>
      <button
        onClick={() => onModeChange('chat')}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium tracking-tight transition-all ${
          mode === 'chat'
            ? 'bg-[#C00F7A] text-white shadow-sm'
            : 'text-[#86868B] hover:text-[#1D1D1F]'
        }`}
      >
        <MessageCircle strokeWidth={1.25} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Agent Chat
      </button>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AppMode>('networking');
  const [step, setStep] = useState<AppStep>('capture');
  const [contact, setContact] = useState<Contact>({
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    address: '',
  });
  const [brandedSelfie, setBrandedSelfie] = useState<string | null>(null);
  const [cardBase64, setCardBase64] = useState<string | null>(null);
  const [cardWatermarked, setCardWatermarked] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [automationResults, setAutomationResults] = useState<AutomationResults | null>(null);
  const [analyzeText, setAnalyzeText] = useState('Analyzing...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // ---- SELFIE CAPTURE: Watermark + stay on capture screen ----
  const handleSelfieCapture = useCallback(async (file: File) => {
    try {
      setStep('analyzing');
      setAnalyzeText('Branding your selfie...');
      const rawBase64 = await fileToBase64(file);
      const compressed = await compressImage(rawBase64, 600, 0.85);

      // Apply VSUAL V-logo watermark
      try {
        const wmResponse = await fetch('/api/watermark-selfie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: compressed }),
        });
        const wmData = await wmResponse.json();
        if (wmData.success && wmData.watermarked_base64) {
          setBrandedSelfie(wmData.watermarked_base64);
        } else {
          setBrandedSelfie(compressed);
        }
      } catch {
        setBrandedSelfie(compressed);
      }

      toast.success('Selfie captured with VSUAL watermark!');
      setStep('capture');
    } catch {
      toast.error('Failed to process selfie. Please try again.');
      setStep('capture');
    }
  }, []);

  // ---- CARD CAPTURE: OCR + Watermark + stay on capture screen ----
  const handleCardCapture = useCallback(async (file: File) => {
    try {
      setStep('analyzing');
      setAnalyzeText('Scanning business card...');
      const rawBase64 = await fileToBase64(file);
      const compressed = await compressImage(rawBase64, 800, 0.85);
      setCardBase64(compressed);

      // Step 1: OCR to extract contact info
      try {
        const ocrResponse = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: compressed }),
        });

        if (ocrResponse.ok) {
          const data = await ocrResponse.json();
          const ocrProvider = data.ocr_provider || 'AI OCR';

          const extractedFields: Record<string, string> = {};
          if (data.name) extractedFields.name = data.name;
          if (data.company) extractedFields.company = data.company;
          if (data.title) extractedFields.title = data.title;
          if (data.email) extractedFields.email = data.email;
          if (data.phone) extractedFields.phone = data.phone;
          if (data.address) extractedFields.address = data.address;

          if (Object.keys(extractedFields).length > 0) {
            setContact({
              name: data.name || '',
              company: data.company || '',
              title: data.title || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
            });
            const fieldCount = Object.keys(extractedFields).length;
            toast.success(`${ocrProvider}: ${fieldCount} field${fieldCount > 1 ? 's' : ''} extracted`);
          } else {
            toast.info('Card scanned. Fill in details manually.');
          }
        } else {
          toast.info('Card captured. Fill in details manually.');
        }
      } catch (ocrErr) {
        console.error('OCR failed:', ocrErr);
        toast.info('Card captured. Fill in details manually.');
      }

      // Step 2: Apply watermark to business card
      try {
        setAnalyzeText('Applying watermark...');
        const wmResponse = await fetch('/api/watermark-selfie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: compressed }),
        });
        const wmData = await wmResponse.json();
        if (wmData.success && wmData.watermarked_base64) {
          setCardWatermarked(wmData.watermarked_base64);
        }
      } catch {
        // Watermark failed - not critical
      }

      toast.success('Business card scanned!');
      setStep('capture');
    } catch {
      toast.error('Failed to process card image. Please try again.');
      setStep('capture');
    }
  }, []);

  // ---- REMOVE SELFIE ----
  const handleRemoveSelfie = useCallback(() => {
    setBrandedSelfie(null);
    toast.info('Selfie removed. Take a new one.');
  }, []);

  // ---- REMOVE CARD ----
  const handleRemoveCard = useCallback(() => {
    setCardBase64(null);
    setCardWatermarked(null);
    setCardUrl(null);
    setContact({ name: '', company: '', title: '', email: '', phone: '', address: '' });
    toast.info('Card removed. Scan a new one.');
  }, []);

  // ---- CARD URL SUBMIT ----
  const handleCardUrlSubmit = useCallback(async (url: string) => {
    try {
      setStep('analyzing');
      setAnalyzeText('Loading card from URL...');
      setCardUrl(url);

      const rawBase64 = await urlToBase64(url);
      const compressed = await compressImage(rawBase64, 800, 0.85);
      setCardBase64(compressed);

      // Step 1: OCR
      try {
        setAnalyzeText('Scanning business card...');
        const ocrResponse = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: compressed }),
        });

        if (ocrResponse.ok) {
          const data = await ocrResponse.json();
          const ocrProvider = data.ocr_provider || 'AI OCR';

          const extractedFields: Record<string, string> = {};
          if (data.name) extractedFields.name = data.name;
          if (data.company) extractedFields.company = data.company;
          if (data.title) extractedFields.title = data.title;
          if (data.email) extractedFields.email = data.email;
          if (data.phone) extractedFields.phone = data.phone;
          if (data.address) extractedFields.address = data.address;

          if (Object.keys(extractedFields).length > 0) {
            setContact({
              name: data.name || '',
              company: data.company || '',
              title: data.title || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
            });
            const fieldCount = Object.keys(extractedFields).length;
            toast.success(`${ocrProvider}: ${fieldCount} field${fieldCount > 1 ? 's' : ''} extracted`);
          } else {
            toast.info('Card loaded. Fill in details manually.');
          }
        } else {
          toast.info('Card loaded. Fill in details manually.');
        }
      } catch (ocrErr) {
        console.error('OCR failed:', ocrErr);
        toast.info('Card loaded. Fill in details manually.');
      }

      // Step 2: Apply watermark
      try {
        setAnalyzeText('Applying watermark...');
        const wmResponse = await fetch('/api/watermark-selfie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: compressed }),
        });
        const wmData = await wmResponse.json();
        if (wmData.success && wmData.watermarked_base64) {
          setCardWatermarked(wmData.watermarked_base64);
        }
      } catch {
        // Watermark failed - not critical
      }

      toast.success('Business card loaded from URL!');
      setStep('capture');
    } catch {
      toast.error('Failed to load image from URL. Check the link and try again.');
      setCardUrl(null);
      setStep('capture');
    }
  }, []);

  // ---- CONTINUE TO FORM ----
  const handleContinueToForm = useCallback(() => {
    setStep('form');
  }, []);

  // ---- SUBMIT: Save to DB ----
  const handleTriggerAutomation = useCallback(async () => {
    setStep('automating');
    setIsSubmitting(true);

    try {
      const saveResponse = await fetch('/api/save-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name,
          company: contact.company,
          title: contact.title,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          selfie_base64: brandedSelfie || undefined,
          card_base64: cardWatermarked || cardBase64 || undefined,
          source: 'VSUAL Networking App',
        }),
      });

      const data = await saveResponse.json();

      if (data.error) {
        toast.error(data.error);
        setStep('form');
        setIsSubmitting(false);
        return;
      }

      const results: AutomationResults = {
        success: data.success,
        message: data.message,
        ghl_status: data.ghl_status || 'unknown',
        drive_status: data.drive_status || 'unknown',
        db_status: data.db_status || 'unknown',
        whatsapp_status: data.whatsapp_status || 'unknown',
        selfie_drive_url: data.selfie_drive_url,
        card_drive_url: data.card_drive_url,
      };

      if (results.db_status === 'success') toast.success('Saved to database!');
      if (results.db_status === 'error') toast.error('Database save failed.');

      setAutomationResults(results);
      setStep('success');
    } catch {
      toast.error('Save failed. Please try again.');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  }, [contact, brandedSelfie, cardWatermarked, cardBase64]);

  // ---- RESET ----
  const handleReset = useCallback(() => {
    setStep('capture');
    setContact({ name: '', company: '', title: '', email: '', phone: '', address: '' });
    setBrandedSelfie(null);
    setCardBase64(null);
    setCardWatermarked(null);
    setCardUrl(null);
    setAutomationResults(null);
  }, []);

  // ---- RE-SCAN / RE-TAKE SELFIE ----
  const handleRescan = useCallback(() => {
    setCardBase64(null);
    setCardWatermarked(null);
    setCardUrl(null);
    setStep('capture');
  }, []);

  const handleRetakeSelfie = useCallback(() => {
    setBrandedSelfie(null);
    setStep('capture');
  }, []);

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
  }, []);

  return (
    <div
      className="w-full max-w-[428px] lg:max-w-[480px] mx-auto min-h-screen relative overflow-hidden bg-[#FBFBFD]"
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Main Content */}
      {!showSplash && (
        <div className="screen-fade-in flex flex-col min-h-screen">
          {/* Mode Toggle */}
          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          {/* Networking Mode */}
          {mode === 'networking' && (
            <main className="flex-1">
              {step === 'capture' && (
                <CaptureScreen
                  brandedSelfie={brandedSelfie}
                  cardBase64={cardBase64}
                  cardWatermarked={cardWatermarked}
                  cardUrl={cardUrl}
                  contact={contact}
                  onCardCapture={handleCardCapture}
                  onSelfieCapture={handleSelfieCapture}
                  onRemoveSelfie={handleRemoveSelfie}
                  onRemoveCard={handleRemoveCard}
                  onCardUrlSubmit={handleCardUrlSubmit}
                  onContinue={handleContinueToForm}
                />
              )}

              {step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] px-4 sm:px-6 screen-fade-in">
                  <Header />
                  {cardBase64 && !cardWatermarked && (
                    <div className="mb-4 w-full max-w-[200px]">
                      <div className="glass-card p-2 rounded-lg overflow-hidden">
                        <img
                          src={cardUrl || `data:image/jpeg;base64,${cardBase64}`}
                          alt="Scanning card"
                          className="w-full h-auto rounded-md opacity-80"
                        />
                      </div>
                      <p className="text-[10px] text-[#86868B] text-center mt-1.5">{cardUrl ? 'Loading card...' : 'Scanning this card...'}</p>
                    </div>
                  )}
                  {!cardBase64 && (
                    <div className="mb-4 w-full max-w-[200px]">
                      <div className="glass-card p-2 rounded-lg overflow-hidden flex items-center justify-center h-28">
                        <Camera className="w-8 h-8 text-[#C00F7A] animate-pulse" />
                      </div>
                      <p className="text-[10px] text-[#86868B] text-center mt-1.5">Processing selfie...</p>
                    </div>
                  )}
                  <AppleSpinner text={analyzeText} />
                </div>
              )}

              {step === 'form' && (
                <ContactFormScreen
                  contact={contact}
                  setContact={setContact}
                  brandedSelfie={brandedSelfie}
                  cardWatermarked={cardWatermarked}
                  cardBase64={cardBase64}
                  cardUrl={cardUrl}
                  onSubmit={handleTriggerAutomation}
                  onBack={handleReset}
                  onRescan={handleRescan}
                  onRetakeSelfie={handleRetakeSelfie}
                  loading={isSubmitting}
                />
              )}

              {step === 'automating' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] px-4 sm:px-6 screen-fade-in">
                  <Header />
                  <AppleSpinner text="Triggering automations..." />
                </div>
              )}

              {step === 'success' && automationResults && (
                <SuccessScreen
                  results={automationResults}
                  contact={contact}
                  brandedSelfie={brandedSelfie}
                  cardWatermarked={cardWatermarked}
                  cardBase64={cardBase64}
                  cardUrl={cardUrl}
                  onReset={handleReset}
                />
              )}
            </main>
          )}

          {/* Agent Chat Mode */}
          {mode === 'chat' && (
            <main className="flex-1 pt-2">
              <div className="flex items-center gap-3 px-4 pb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#C00F7A]/10 flex items-center justify-center">
                  <Zap strokeWidth={1.25} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C00F7A]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#1D1D1F]">VSUAL Assistant</h3>
                  <p className="text-[11px] text-[#86868B]">Powered by AI</p>
                </div>
              </div>
              <AgentChat />
            </main>
          )}
        </div>
      )}
    </div>
  );
}
