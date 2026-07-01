import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();
    
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to retrieve tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant context not found for user' }, { status: 400 });
    }

    // Get tenant's SMS settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('sms_api_user, sms_api_password, sms_sender_id, sms_provider')
      .eq('id', profile.tenant_id)
      .single();

    const smsUser = tenant?.sms_api_user || process.env.POLI_SMS_USER;
    const smsPass = tenant?.sms_api_password || process.env.POLI_SMS_PASS;
    const header = tenant?.sms_sender_id || process.env.POLI_SMS_HEADER || 'NOVOEMLAK';

    if (!smsUser || !smsPass) {
      return NextResponse.json({ error: 'SMS API credentials (sms_api_user/password) are missing for this tenant.' }, { status: 500 });
    }

    const result = await sendSms({
      user: smsUser,
      pass: smsPass,
      message,
      contacts: [phone],
      header,
    }, tenant?.sms_provider || 'polidijital');

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
