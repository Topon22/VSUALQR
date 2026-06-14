'use client';

import { Heart, Globe, Zap } from 'lucide-react';
import { MAGENTA } from '@/lib/vsual-types';

export function Footer() {
  return (
    <footer className="mt-auto w-full">
      <div className="mx-4 mb-4 mt-6">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.03)] px-5 py-4">
          {/* Brand Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${MAGENTA}, #E91E90)` }}
              >
                <span className="text-white font-bold text-xs">V</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 tracking-tight">VSUAL</p>
                <p className="text-[10px] text-gray-400 font-medium -mt-0.5">Digital Media</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#C00F7A]" />
              <span className="text-[10px] font-semibold text-gray-500">Powered by Z AI</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-3" />

          {/* Links Row */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-medium">
            <a
              href="https://vsualdigitalmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#C00F7A] transition-colors"
            >
              <Globe className="w-3 h-3" />
              vsualdigitalmedia.com
            </a>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-2.5 h-2.5 text-[#C00F7A] fill-[#C00F7A]" /> in Dhaka
            </span>
          </div>

          {/* Copyright */}
          <p className="text-center text-[9px] text-gray-300 mt-2 font-medium">
            &copy; {new Date().getFullYear()} VSUALdigitalmedia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
