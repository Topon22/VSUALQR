/**
 * VSUAL Networking App — Shared Type Definitions
 */

/** Contact information extracted from a business card or entered manually. */
export interface Contact {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
}

/** Results returned from the automation pipeline after saving a contact. */
export interface AutomationResults {
  success: boolean;
  message: string;
  ghl_status: 'success' | 'skipped' | 'error' | 'unknown' | 'tracked';
  drive_status: 'success' | 'skipped' | 'error' | 'unknown';
  db_status: 'success' | 'skipped' | 'error' | 'unknown';
  whatsapp_status: 'success' | 'skipped' | 'error' | 'unknown';
  selfie_drive_url?: string;
  card_drive_url?: string;
}

/** A single chat message in the AI assistant panel. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/** The current step within the networking workflow. */
export type AppStep = 'capture' | 'analyzing' | 'form' | 'automating' | 'success';

/** Top-level app mode — networking capture or AI chat. */
export type AppMode = 'networking' | 'chat';

/** Brand color constant — magenta. */
export const MAGENTA = '#C00F7A';

/** WhatsApp group invite link. */
export const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Hn4Ox86GwWz0Wp1oDQ6aA0';
