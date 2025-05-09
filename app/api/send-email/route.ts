// app/api/send-email/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.EMAIL_CLIENT_ID,
  process.env.EMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

// Set credentials with refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function POST(request: Request) {
  try {
    const { to, subject, message } = await request.json();

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the email with proper headers and black text styling
    const emailContent = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      'From: "TradeTrack" <' + process.env.EMAIL_USER + '>',
      `Subject: ${subject}`,
      '',
      `<div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #333;">TradeTrack</h1>
        <div>${message}</div>
        <hr>
        <p style="color: #666; font-size: 12px;">This email was sent from the TradeTrack application.</p>
      </div>`
    ].join('\n');

    // Encode the email for the Gmail API
    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log(`Sending email to ${to} with subject "${subject}"`);

    // Send the email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log('Email sent successfully, message ID:', result.data.id);

    return NextResponse.json(
      { success: true, messageId: result.data.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // More detailed error logging for debugging
    if (error.response) {
      console.error('API response error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
