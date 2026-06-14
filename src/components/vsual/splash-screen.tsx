'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

/**
 * Video Splash Screen
 *
 * Plays the VSUAL brand video on initial load with:
 * - Poster image shown while video loads
 * - Autoplay with fallback tap-to-play for iOS Safari
 * - Progress bar and skip hint
 * - Keyboard support (Escape / Enter to skip)
 * - Automatic timeout fallback
 *
 * FIX: Uses useMemo for device detection to avoid SSR hydration mismatch
 * instead of `typeof window` in constant declarations.
 * FIX: Removed useDeviceType hook that called setState in an effect body,
 * which is flagged by react-hooks/set-state-in-effect lint rule.
 */

type SplashPhase = 'loading' | 'ready' | 'playing' | 'blocked';

interface SplashScreenProps {
  /** Called when the splash screen has finished. */
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fading, setFading] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>('loading');
  const [videoProgress, setVideoProgress] = useState(0);
  const completedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use same video for all devices (720p is sufficient)
  const videoSrc = useMemo(() => '/red-720p.mp4', []);

  /** Safely trigger completion — ensures we only call onComplete once. */
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

  /** Handle tap: if blocked (iOS), try to play; otherwise skip. */
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

  // Attempt autoplay once the video data has loaded
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onLoaded = () => {
      setPhase('ready');
      vid.play().then(() => setPhase('playing')).catch(() => setPhase('blocked'));
    };
    vid.addEventListener('loadeddata', onLoaded);
    return () => vid.removeEventListener('loadeddata', onLoaded);
  }, [videoSrc]);

  // Auto-skip after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completedRef.current) triggerComplete();
    }, 6000);
    return () => clearTimeout(timer);
  }, [triggerComplete]);

  // Keyboard support for skipping
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
      {/* Poster image — shown instantly while video loads */}
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

      {/* Phase 2: Autoplay blocked (iOS Safari) — show play button */}
      {phase === 'blocked' && (
        <div className="splash-tap-overlay">
          <div className="splash-play-btn" role="button" aria-label="Play video">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
          <p className="text-white/90 text-sm font-medium mt-3">Tap to Continue</p>
        </div>
      )}

      {/* Phase 3: Playing — progress bar + skip hint */}
      {phase === 'playing' && !fading && (
        <div className="splash-bottom-bar">
          <div className="splash-progress-track" role="progressbar" aria-valuenow={Math.round(videoProgress)} aria-valuemin={0} aria-valuemax={100}>
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
