import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function encodeUuid(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  return Buffer.from(hex, 'hex').toString('base64url');
}

export function decodeUuid(slug: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return slug.toLowerCase();
  }
  if (slug.length === 22) {
    try {
      const buf = Buffer.from(slug, 'base64url');
      if (buf.length === 16) {
        const hex = buf.toString('hex');
        const uuid = [
          hex.substring(0, 8),
          hex.substring(8, 12),
          hex.substring(12, 16),
          hex.substring(16, 20),
          hex.substring(20)
        ].join('-');
        if (uuidRegex.test(uuid)) {
          return uuid.toLowerCase();
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  return null;
}

export function getVapiRecordingUrl(url: string | null | undefined, callId?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/api/vapi/recording')) return url;
  if (!url.includes('storage.vapi.ai') && !url.includes('calllogs.vapi.ai')) return url;
  
  const encodedUrl = encodeURIComponent(url);
  let proxyUrl = `/api/vapi/recording?url=${encodedUrl}`;
  if (callId) {
    proxyUrl += `&callId=${callId}`;
  }
  return proxyUrl;
}
