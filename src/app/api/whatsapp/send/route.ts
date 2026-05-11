import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, sendWhatsAppMedia, sendWhatsAppTemplate } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, messageType, content, mediaUrl, templateName, templateParams, namedParams } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let result;

    if (messageType === 'template') {
      if (!templateName) return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      // Use named params if provided, otherwise fall back to positional
      const params = namedParams || templateParams || [];
      result = await sendWhatsAppTemplate(phone, templateName, params);
    } else if (messageType === 'text') {
      if (!content) return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
      result = await sendWhatsAppMessage(phone, content);
    } else {
      // media
      if (!mediaUrl) return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
      result = await sendWhatsAppMedia(phone, messageType, mediaUrl, content);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send WhatsApp message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
