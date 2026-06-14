'use client';

import { useState, useCallback } from 'react';
import {
  Camera,
  Home as HomeIcon,
  Loader2,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Component imports
import { SplashScreen } from '@/components/vsual/splash-screen';
import { CaptureScreen } from '@/components/vsual/capture-screen';
import { ContactFormScreen } from '@/components/vsual/contact-form';
import { SuccessScreen } from '@/components/vsual/success-screen';
import { ChatPanel } from '@/components/vsual/chat-panel';
import { Header } from '@/components/vsual/header';
import { Footer } from '@/components/vsual/footer';

// Utility & type imports
import { fileToBase64, urlToBase64, compressImage } from '@/lib/vsual-utils';
import type {
  Contact,
  AutomationResults,
  AppStep,
  AppMode,
} from '@/lib/vsual-types';

// ==================== ANALYZING SPINNER ====================

/** Apple-style spinner with rotating dots. */
function AppleSpinner({ text = 'Analyzing...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12">
      <div className="relative w-14 h-14" role="status" aria-label={text}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#C00F7A',
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

// ==================== MODE TOGGLE ====================

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm mx-3 sm:mx-4 mt-3 sm:mt-4 p-1 flex items-center gap-1 rounded-xl">
      <button
        onClick={() => onModeChange('networking')}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium tracking-tight transition-all ${
          mode === 'networking'
            ? 'bg-[#C00F7A] text-white shadow-sm'
            : 'text-[#86868B] hover:text-[#1D1D1F]'
        }`}
        aria-label="Switch to capture mode"
        aria-pressed={mode === 'networking'}
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
        aria-label="Switch to agent chat mode"
        aria-pressed={mode === 'chat'}
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
      } catch {
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
      } catch {
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
      className="w-full max-w-[428px] lg:max-w-[480px] mx-auto min-h-screen flex flex-col relative overflow-hidden bg-[#FBFBFD]"
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
                      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm p-2 rounded-lg overflow-hidden">
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
                      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm p-2 rounded-lg overflow-hidden flex items-center justify-center h-28">
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
              <ChatPanel />
            </main>
          )}

          {/* Sticky Footer */}
          <Footer />
        </div>
      )}
    </div>
  );
}
