'use client';

/**
 * VSUAL Sticky Footer
 *
 * Must be used inside a parent with `min-h-screen flex flex-col`
 * so that `mt-auto` pushes it to the bottom on short pages.
 */

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center py-3 px-4 gap-0.5">
        <p className="text-[10px] sm:text-[11px] text-[#999999] font-normal uppercase tracking-tight">
          VSUALDIGITALMEDIA
        </p>
        <p className="text-[8px] sm:text-[9px] text-[#BBBBBB] uppercase" style={{ letterSpacing: '3px' }}>
          Promotional Marketing Agency
        </p>
      </div>
    </footer>
  );
}
