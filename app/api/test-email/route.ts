import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Email test API called');

    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: to, subject, and message are required' 
      }, { status: 400 });
    }

    console.log('📧 Sending email to:', to);
    console.log('📨 Subject:', subject);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">🧪 TradersTap Email Test</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
        <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #2e7d32; text-align: center;">
            ✅ <strong>OAuth2 Email Service Working!</strong>
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Sent from: noreply.tradestap@gmail.com using OAuth2.
        </p>
      </div>
    `;

    const result = await sendEmail(to, subject, htmlContent);

    if (result.success) {
      console.log('✅ Email sent!');
      return NextResponse.json({ success: true });
    } else {
      console.error('❌ Email failed:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Server error:', error.message || error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
