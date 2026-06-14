'use client';

/**
 * VSUAL Branded Header
 *
 * Displays "VSUALDIGITALMEDIA" and "PROMOTIONAL MARKETING AGENCY"
 * in a consistent brand style across all screens.
 */

export function Header() {
  return (
    <header className="flex flex-col items-center pt-6 sm:pt-8 pb-3 sm:pb-4">
      <p
        className="text-[13px] sm:text-[14px] text-[#777777] font-normal uppercase tracking-tight text-center"
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        VSUALDIGITALMEDIA
      </p>
      <p
        className="text-[9px] sm:text-[10px] text-[#777777] font-normal uppercase mt-0.5 text-center"
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          letterSpacing: '4px',
        }}
      >
        PROMOTIONAL MARKETING AGENCY
      </p>
    </header>
  );
}
