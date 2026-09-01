import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'TRY') {
  // Validate currency code - must be a 3-letter ISO code
  const validCurrency = (typeof currency === 'string' && /^[A-Z]{3}$/i.test(currency.trim()))
    ? currency.trim().toUpperCase()
    : 'TRY'
  
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: validCurrency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    // Ultimate fallback - plain number formatting
    return `${new Intl.NumberFormat('tr-TR').format(amount)} ${validCurrency}`
  }
}

export function encodeUuid(uuid: string): string {
  if (!uuid) return '';
  try {
    const hex = uuid.replace(/-/g, '');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(hex, 'hex').toString('base64url');
    }
    // Browser fallback
    const match = hex.match(/.{1,2}/g);
    if (!match) return uuid;
    const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return uuid;
  }
}

export function decodeUuid(slug: string): string | null {
  if (!slug) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return slug.toLowerCase();
  }
  if (slug.length === 22) {
    try {
      if (typeof Buffer !== 'undefined') {
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
      } else {
        // Browser fallback
        let base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binary = atob(base64);
        let hex = '';
        for (let i = 0; i < binary.length; i++) {
          const h = binary.charCodeAt(i).toString(16).padStart(2, '0');
          hex += h;
        }
        if (hex.length === 32) {
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
  if (
    !url.includes('storage.vapi.ai') &&
    !url.includes('calllogs.vapi.ai') &&
    !url.includes('cloudflarestorage.com')
  ) {
    return url;
  }
  
  const encodedUrl = encodeURIComponent(url);
  let proxyUrl = `/api/vapi/recording?url=${encodedUrl}`;
  if (callId) {
    proxyUrl += `&callId=${callId}`;
  }
  return proxyUrl;
}
