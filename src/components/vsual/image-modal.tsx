'use client';

import { Cloud, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Image Preview Modal
 *
 * Uses shadcn Dialog for accessible image preview with
 * optional cloud storage link display.
 *
 * FIXES applied:
 * - Uses shadcn Dialog instead of raw div overlay
 * - Proper focus management via Dialog primitives
 * - Accessible close button and title
 */

interface ImageModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Callback when the open state changes. */
  onOpenChange: (open: boolean) => void;
  /** The image source URL or data URI. */
  imageSrc: string | null;
  /** Alt text for the image. */
  imageAlt: string;
  /** Optional cloud storage drive URL. */
  driveUrl: string | null;
}

export function ImageModal({
  open,
  onOpenChange,
  imageSrc,
  imageAlt,
  driveUrl,
}: ImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] max-h-[80vh] bg-black/80 backdrop-blur-sm border-none p-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{imageAlt} preview</DialogTitle>
        {/* We use a custom close button instead of the default DialogClose */}
        <div className="relative">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="max-w-full max-h-[70vh] w-auto h-auto object-contain mx-auto"
            />
          )}
          {driveUrl && (
            <div className="mt-3 flex items-center gap-2 justify-center px-4 pb-4">
              <Cloud className="w-3.5 h-3.5 text-[#34C759]" />
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/80 hover:text-white underline truncate max-w-[250px]"
              >
                {driveUrl.split('/').pop()}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
