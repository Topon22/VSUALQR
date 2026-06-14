'use client';

/**
 * VSUAL Sticky Footer
 *
 * Must be used inside a parent with `min-h-screen flex flex-col`
 * so that `mt-auto` pushes it to the bottom on short pages.
 */

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-[#C00F7A]/10 bg-white/90 backdrop-blur-md">
      <div className="flex flex-col items-center py-3 px-4 gap-0.5">
        <p className="text-[10px] sm:text-[11px] text-[#777] font-semibold uppercase tracking-wider">
          VSUALDIGITALMEDIA
        </p>
        <p className="text-[8px] sm:text-[9px] text-[#999] uppercase font-medium" style={{ letterSpacing: '3px' }}>
          Promotional Marketing Agency
        </p>
      </div>
    </footer>
  );
}
