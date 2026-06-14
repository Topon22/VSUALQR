/**
 * GoHighLevel CRM helper functions
 * Supports V2 Private Integration Tokens
 */

const GHL_API_KEY = process.env.GHL_API_KEY || '';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || '';
const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_TRACKING_ID = process.env.GHL_TRACKING_ID || '';

export function isGHLConfigured(): boolean {
  return !!(GHL_API_KEY && GHL_API_KEY.length > 5);
}

interface GHLContactData {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address?: string;
  source?: string;
}

export interface GHLResult {
  success: boolean;
  status: 'success' | 'skipped' | 'error' | 'tracked';
  message: string;
  contactId?: string;
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${GHL_API_KEY}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  };
}

export async function createGHLContact(data: GHLContactData): Promise<GHLResult> {
  if (!isGHLConfigured()) {
    return { success: false, status: 'skipped', message: 'GHL not configured. Set GHL_API_KEY.' };
  }

  const { name, company, title, email, phone, address, source } = data;
  const nameParts = name.trim().split(/\s+/, 2);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const payload: Record<string, unknown> = {
    firstName,
    lastName,
    customFields: [
      { key: 'job_title', field_value: title || '' },
      ...(source ? [{ key: 'source', field_value: source }] : []),
    ],
  };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (company) payload.companyName = company;

  const headers = getHeaders();

  if (GHL_LOCATION_ID) {
    try {
      const endpoints = [
        `${GHL_BASE_URL}/contacts/upsert?locationId=${GHL_LOCATION_ID}`,
        `${GHL_BASE_URL}/contacts/?locationId=${GHL_LOCATION_ID}`,
      ];

      for (const url of endpoints) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          const responseData = await response.json().catch(() => ({}));

          if (response.status === 200 || response.status === 201) {
            const contactId = responseData?.contact?.id || responseData?.id || 'unknown';
            return { success: true, status: 'success', message: `Contact added to GoHighLevel (${contactId})`, contactId };
          }

          if (response.status === 409 || response.status === 400) {
            // Contact already exists — try to update
            const searchField = email ? 'email' : phone ? 'phone' : null;
            if (searchField) {
              const searchValue = searchField === 'email' ? email : phone;
              const searchQuery = searchField === 'email' ? `email == "${searchValue}"` : `phone == "${searchValue}"`;
              const searchResponse = await fetch(
                `${GHL_BASE_URL}/contacts/?query=${encodeURIComponent(searchQuery)}&locationId=${GHL_LOCATION_ID}`,
                { headers },
              );
              if (searchResponse.ok) {
                const searchData = await searchResponse.json().catch(() => ({}));
                const contacts = searchData?.contacts || [];
                if (contacts.length > 0) {
                  const existingId = contacts[0].id;
                  const updateResponse = await fetch(
                    `${GHL_BASE_URL}/contacts/${existingId}?locationId=${GHL_LOCATION_ID}`,
                    { method: 'PUT', headers, body: JSON.stringify(payload) },
                  );
                  if (updateResponse.ok) {
                    return { success: true, status: 'success', message: `Contact updated in GoHighLevel (${existingId})`, contactId: existingId };
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`[GHL] ${url} failed:`, err);
        }
      }

      return { success: false, status: 'error', message: 'GHL API: All endpoints failed.' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, status: 'error', message: `GHL failed: ${msg}` };
    }
  }

  return { success: false, status: 'tracked', message: 'GHL location ID not set. Contact tracked via pixel.' };
}

export function getGHLStatus() {
  return {
    configured: isGHLConfigured(),
    hasApiKey: GHL_API_KEY.length > 10,
    hasLocationId: !!GHL_LOCATION_ID,
    tokenType: GHL_API_KEY.startsWith('pit-') ? 'V2 Private Integration Token' : 'V1 Legacy Key',
    tokenPrefix: GHL_API_KEY ? GHL_API_KEY.substring(0, 12) + '...' : 'NOT SET',
    locationId: GHL_LOCATION_ID || 'NOT SET',
    baseUrl: GHL_BASE_URL,
    trackingPixel: !!GHL_TRACKING_ID,
    trackingId: GHL_TRACKING_ID || 'NOT SET',
  };
}
