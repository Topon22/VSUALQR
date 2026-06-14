'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ImageIcon,
  Camera,
  CreditCard,
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw,
  Database,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MAGENTA } from '@/lib/vsual-types';

// ==================== TYPES ====================

interface ImageEntry {
  type: string;
  label: string;
  url: string;
  hasData: boolean;
}

interface ContactImageGroup {
  contactId: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  source: string;
  images: ImageEntry[];
  totalImages: number;
  selfieDriveUrl: string | null;
  cardDriveUrl: string | null;
  createdAt: string;
}

interface ImagesResponse {
  success: boolean;
  entries: ContactImageGroup[];
  totalContacts: number;
  totalImages: number;
  message: string;
}

// ==================== IMAGE GALLERY ====================

export function ImageGallery() {
  const [data, setData] = useState<ImagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string; open: boolean }>({
    url: '',
    alt: '',
    open: false,
  });

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/images');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Link copied!'))
      .catch(() => toast.error('Failed to copy'));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#C00F7A]/10 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[#C00F7A] animate-spin" />
        </div>
        <p className="text-sm text-[#86868B] font-medium">Loading stored images...</p>
      </div>
    );
  }

  // ==================== EMPTY STATE ====================
  if (!data || !data.entries || data.entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-gray-300" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Images Stored Yet</h3>
          <p className="text-sm text-[#86868B]">
            Captured selfies and business cards will appear here after saving contacts.
          </p>
        </div>
        <Button
          onClick={fetchImages}
          variant="outline"
          className="mt-2 rounded-xl text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>
    );
  }

  // ==================== IMAGE GRID ====================
  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#C00F7A]" />
          <span className="text-sm font-bold text-gray-900">
            {data.totalImages} Image{data.totalImages !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-[#86868B]">
            ({data.totalContacts} contact{data.totalContacts !== 1 ? 's' : ''})
          </span>
        </div>
        <Button
          onClick={fetchImages}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg"
          aria-label="Refresh images"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#86868B]" />
        </Button>
      </div>

      {/* Contact Image Cards */}
      <div className="space-y-3">
        {data.entries.map((entry, index) => (
          <motion.div
            key={entry.contactId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card className="overflow-hidden bg-white/80 backdrop-blur-xl border-white/50 shadow-sm hover:shadow-md transition-shadow">
              {/* Contact Info Header */}
              <button
                onClick={() => toggleExpand(entry.contactId)}
                className="w-full text-left p-4 flex items-center gap-3"
                aria-label={`${expandedId === entry.contactId ? 'Collapse' : 'Expand'} ${entry.name}'s images`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C00F7A]/10 to-[#E91E90]/10 flex items-center justify-center shrink-0">
                  {entry.images.find((i) => i.type === 'selfie' || i.type === 'branded') ? (
                    <img
                      src={entry.images.find((i) => i.type === 'selfie')?.url || entry.images[0]?.url}
                      alt={entry.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#C00F7A]" />
                  )}
                </div>

                {/* Name & details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {entry.name || 'Unknown Contact'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#86868B]">
                    {entry.company && (
                      <span className="truncate">{entry.company}</span>
                    )}
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#C00F7A]/10 text-[#C00F7A] font-semibold text-[10px]">
                      {entry.totalImages} img{entry.totalImages !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Expand/Collapse icon */}
                <div className="shrink-0 text-[#86868B]">
                  {expandedId === entry.contactId ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Expanded Image Grid */}
              <AnimatePresence>
                {expandedId === entry.contactId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="px-4 pb-4 pt-0 space-y-3">
                      {/* Contact details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {entry.title && (
                          <div className="flex items-center gap-1.5 text-[#86868B]">
                            <Briefcase className="w-3 h-3" />
                            <span className="truncate">{entry.title}</span>
                          </div>
                        )}
                        {entry.email && (
                          <div className="flex items-center gap-1.5 text-[#86868B]">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{entry.email}</span>
                          </div>
                        )}
                        {entry.phone && (
                          <div className="flex items-center gap-1.5 text-[#86868B]">
                            <Phone className="w-3 h-3" />
                            <span className="truncate">{entry.phone}</span>
                          </div>
                        )}
                        {entry.createdAt && (
                          <div className="flex items-center gap-1.5 text-[#86868B]">
                            <Calendar className="w-3 h-3" />
                            <span className="truncate">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Image Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {entry.images.map((img) => (
                          <button
                            key={img.type}
                            onClick={() =>
                              setPreviewImage({ url: img.url, alt: `${entry.name} - ${img.label}`, open: true })
                            }
                            className="relative group rounded-xl overflow-hidden border-2 border-gray-100 hover:border-[#C00F7A]/40 transition-colors aspect-square"
                            aria-label={`View ${img.label} for ${entry.name}`}
                          >
                            <img
                              src={img.url}
                              alt={`${entry.name} ${img.label}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 inset-x-0 p-1.5">
                                <div className="flex items-center gap-1">
                                  {img.type === 'selfie' || img.type === 'branded' ? (
                                    <Camera className="w-2.5 h-2.5 text-white" />
                                  ) : (
                                    <CreditCard className="w-2.5 h-2.5 text-white" />
                                  )}
                                  <span className="text-[9px] text-white font-semibold">{img.label}</span>
                                </div>
                              </div>
                            </div>
                            {/* Type badge */}
                            <div className="absolute top-1 right-1">
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center"
                                style={{ backgroundColor: `${MAGENTA}20` }}
                              >
                                {img.type === 'selfie' || img.type === 'branded' ? (
                                  <Camera className="w-3 h-3" style={{ color: MAGENTA }} />
                                ) : (
                                  <CreditCard className="w-3 h-3" style={{ color: MAGENTA }} />
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Drive URLs */}
                      {(entry.selfieDriveUrl || entry.cardDriveUrl) && (
                        <div className="space-y-1.5">
                          {entry.selfieDriveUrl && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                              <ImageIcon className="w-3 h-3 text-[#C00F7A] shrink-0" />
                              <span className="text-[10px] text-[#86868B] truncate flex-1">Selfie URL</span>
                              <button
                                onClick={() => copyToClipboard(entry.selfieDriveUrl!)}
                                className="shrink-0"
                                aria-label="Copy selfie URL"
                              >
                                <Copy className="w-3 h-3 text-[#86868B] hover:text-[#C00F7A]" />
                              </button>
                              <a
                                href={entry.selfieDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                                aria-label="Open selfie in new tab"
                              >
                                <ExternalLink className="w-3 h-3 text-[#86868B] hover:text-[#C00F7A]" />
                              </a>
                            </div>
                          )}
                          {entry.cardDriveUrl && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                              <ImageIcon className="w-3 h-3 text-[#C00F7A] shrink-0" />
                              <span className="text-[10px] text-[#86868B] truncate flex-1">Card URL</span>
                              <button
                                onClick={() => copyToClipboard(entry.cardDriveUrl!)}
                                className="shrink-0"
                                aria-label="Copy card URL"
                              >
                                <Copy className="w-3 h-3 text-[#86868B] hover:text-[#C00F7A]" />
                              </button>
                              <a
                                href={entry.cardDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                                aria-label="Open card in new tab"
                              >
                                <ExternalLink className="w-3 h-3 text-[#86868B] hover:text-[#C00F7A]" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Image Preview Modal */}
      <Dialog
        open={previewImage.open}
        onOpenChange={(open) => setPreviewImage({ ...previewImage, open })}
      >
        <DialogContent
          className="max-w-[90vw] max-h-[80vh] bg-black/90 backdrop-blur-sm border-none p-0 overflow-hidden"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{previewImage.alt}</DialogTitle>
          <div className="relative">
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-w-full max-h-[70vh] w-auto h-auto object-contain mx-auto"
            />
            <div className="flex items-center justify-center gap-3 px-4 pb-4 pt-2">
              <Button
                onClick={() => copyToClipboard(previewImage.url)}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
              </Button>
              <a href={previewImage.url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Full
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
