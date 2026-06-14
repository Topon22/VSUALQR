'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  RefreshCw,
  Database,
  MessageCircle,
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Header } from './header';
import { contactSchema, type ContactFormValues } from '@/lib/vsual-validation';
import type { Contact } from '@/lib/vsual-types';

/**
 * Contact Form Screen
 *
 * Displays captured images and allows the user to review/edit
 * contact details before saving.
 *
 * FIXES applied:
 * - Uses react-hook-form + zod for proper validation
 * - Uses shadcn Form, FormField, FormItem, Input, Label components
 * - Proper aria labels and keyboard navigation
 */

interface ContactFormScreenProps {
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
}

export function ContactFormScreen({
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
}: ContactFormScreenProps) {
  // Initialize react-hook-form with zod validation
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact.name,
      company: contact.company,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
    },
  });

  /** Called when the form passes validation — syncs values back to parent state. */
  const handleFormSubmit = useCallback(
    (values: ContactFormValues) => {
      setContact({
        name: values.name,
        company: values.company ?? '',
        title: values.title ?? '',
        email: values.email ?? '',
        phone: values.phone ?? '',
        address: values.address ?? '',
      });
      onSubmit();
    },
    [setContact, onSubmit],
  );

  return (
    <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-5 screen-fade-in">
      <Header />

      {/* Back button + title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="icon"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 backdrop-blur-xl border-[#C00F7A]/30"
          aria-label="Go back to capture screen"
        >
          <ArrowLeft strokeWidth={1.25} className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D1D1F]" />
        </Button>
        <h2 className="text-xl sm:text-2xl tracking-tight font-medium text-black">Review &amp; Save</h2>
      </div>

      {/* Captured Images Preview */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Branded Selfie Preview */}
        {brandedSelfie ? (
          <Card className="p-2 bg-white/70 backdrop-blur-xl border-white/40 shadow-sm">
            <CardContent className="p-0">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${brandedSelfie}`}
                  alt="Branded selfie"
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
                aria-label="Retake selfie"
              >
                <Camera className="w-3 h-3" /> Re-take
              </button>
            </CardContent>
          </Card>
        ) : (
          <button
            onClick={onRetakeSelfie}
            className="rounded-xl border-2 border-dashed border-gray-200 py-5 flex flex-col items-center justify-center gap-2 text-[#86868B] hover:border-[#C00F7A]/50 hover:text-[#C00F7A] transition-all active:scale-95"
            aria-label="Add a selfie"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs font-medium">Add Selfie</span>
          </button>
        )}

        {/* Business Card Preview */}
        {cardBase64 ? (
          <Card className="p-2 bg-white/70 backdrop-blur-xl border-white/40 shadow-sm">
            <CardContent className="p-0">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={cardWatermarked ? `data:image/jpeg;base64,${cardWatermarked}` : cardUrl || `data:image/jpeg;base64,${cardBase64}`}
                  alt="Business card"
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
                aria-label="Rescan business card"
              >
                <RefreshCw className="w-3 h-3" /> Re-scan
              </button>
            </CardContent>
          </Card>
        ) : (
          <button
            onClick={onRescan}
            className="rounded-xl border-2 border-dashed border-gray-200 py-5 flex flex-col items-center justify-center gap-2 text-[#86868B] hover:border-[#C00F7A]/50 hover:text-[#C00F7A] transition-all active:scale-95"
            aria-label="Scan a business card"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Scan Card</span>
          </button>
        )}
      </div>

      {/* Contact Form with zod validation */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} noValidate>
          <Card className="p-4 sm:p-5 bg-white/70 backdrop-blur-xl border-white/40 shadow-sm">
            <CardContent className="p-0 space-y-3 sm:space-y-4">
              <p className="text-xs font-medium text-[#86868B] uppercase tracking-wider mb-1">Contact Details</p>

              {/* Name (required) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
                      <User strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-white/50 backdrop-blur-md border-gray-200/50 rounded-xl focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company */}
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
                      <Building2 strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />
                      Company
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Corp"
                        className="bg-white/50 backdrop-blur-md border-gray-200/50 rounded-xl focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
                      <Briefcase strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sales Director"
                        className="bg-white/50 backdrop-blur-md border-gray-200/50 rounded-xl focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
                      <Mail strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@acme.com"
                        className="bg-white/50 backdrop-blur-md border-gray-200/50 rounded-xl focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
                      <Phone strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 555 123 4567"
                        className="bg-white/50 backdrop-blur-md border-gray-200/50 rounded-xl focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1D1D1F] tracking-tight flex items-center gap-2">
                      <MapPin strokeWidth={1.25} className="w-4 h-4 text-[#86868B]" />
                      Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main St, City, State"
                        className="bg-white/50 backdrop-blur-md border-gray-200/50 rounded-xl focus:ring-[#C00F7A]/30 focus:border-[#C00F7A]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-3 pb-6 sm:pb-8 mt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C00F7A] hover:bg-[#9A0C62] text-white rounded-xl py-3 px-6 font-medium tracking-tight shadow-sm active:scale-95 transition-all"
              aria-label="Confirm and save contact"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check strokeWidth={1.5} className="w-4 h-4" />
                  Confirm &amp; Save
                </span>
              )}
            </Button>

            <div className="flex items-center justify-center gap-3 text-xs text-[#86868B]" aria-hidden="true">
              <span className="flex items-center gap-1"><Database strokeWidth={1.25} className="w-3.5 h-3.5" /> DB</span>
              <span className="flex items-center gap-1"><MessageCircle strokeWidth={1.25} className="w-3.5 h-3.5" /> WhatsApp</span>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
