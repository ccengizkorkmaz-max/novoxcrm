import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_BASE_URL = 'https://api.vapi.ai';

function extractCallIdFromVapiStore(url: string): string | null {
  if (!url) return null;

  // 1. If it's calllogs.vapi.ai
  if (url.includes('calllogs.vapi.ai')) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    if (filename) {
      const match = filename.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match) return match[1];
    }
  }

  // 2. If it's storage.vapi.ai
  if (url.includes('storage.vapi.ai')) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    if (filename) {
      const match = filename.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match) return match[1];
    }
  }

  // 3. General fallback: match any UUIDs
  const matches = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
  if (matches && matches.length > 0) {
    return matches[matches.length > 1 && url.includes('calllogs.vapi.ai') ? 1 : 0];
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const url = searchParams.get('url');
    const type = searchParams.get('type') || 'mono-recording'; // mono-recording, stereo-recording, video-recording, call-logs, pcap

    let resolvedCallId = callId;

    if (!resolvedCallId && url) {
      resolvedCallId = extractCallIdFromVapiStore(url);
    }

    if (!resolvedCallId) {
      return NextResponse.json({ error: 'Valid callId or recording URL with call UUID is required' }, { status: 400 });
    }

    if (!VAPI_API_KEY) {
      return NextResponse.json({ error: 'Vapi API key not configured' }, { status: 500 });
    }

    // 3. Request short-lived signed URL from Vapi
    const endpoint = `${VAPI_BASE_URL}/call/${resolvedCallId}/${type}`;
    console.log(`[Vapi Recording Proxy] Fetching signed URL from: ${endpoint}`);

    // Try manual redirect first
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
      redirect: 'manual',
    });

    if (response.status === 302 || response.status === 307 || response.status === 301) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Fallback: follow redirect automatically and return the final URL
    const finalResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (finalResponse.ok) {
      return NextResponse.redirect(finalResponse.url);
    }

    const errText = await finalResponse.text();
    return NextResponse.json({ error: `Vapi returned status ${finalResponse.status}: ${errText}` }, { status: finalResponse.status });

  } catch (error: any) {
    console.error('[Vapi Recording Proxy Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
