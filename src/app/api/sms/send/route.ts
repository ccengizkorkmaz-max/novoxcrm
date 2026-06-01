import { NextRequest, NextResponse } from 'next/server';
import { sendPoliSms } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const smsUser = process.env.POLI_SMS_USER;
    const smsPass = process.env.POLI_SMS_PASS;
    const header = process.env.POLI_SMS_HEADER || 'NOVOEMLAK';

    if (!smsUser || !smsPass) {
      return NextResponse.json({ error: 'SMS API credentials (POLI_SMS_USER/PASS) are missing on server' }, { status: 500 });
    }

    const result = await sendPoliSms({
      user: smsUser,
      pass: smsPass,
      message,
      contacts: [phone],
      header,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
