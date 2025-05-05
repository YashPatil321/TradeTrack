import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * API endpoint for testing email functionality using direct Gmail API
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { email, subject, message } = await req.json();
    
    if (!email || !subject || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: email, subject, and message are required' 
      }, { status: 400 });
    }

    // Configure Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.EMAIL_CLIENT_ID,
      process.env.EMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Redirect URL
    );

    // Set credentials with refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Create Gmail API instance
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create the email with proper headers and black text styling
    const emailContent = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${email}`,
      'From: "TradeTrack" <' + process.env.EMAIL_USER + '>',
      `Subject: ${subject}`,
      '',
      message
    ].join('\n');

    // Encode the email for the Gmail API
    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log('Email sent successfully, message ID:', result.data.id);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.data.id,
      message: `Email sent successfully to ${email}` 
    });
    
  } catch (error: any) {
    console.error('======== EMAIL ERROR ========');
    console.error('Error message:', error.message);
    
    // More detailed error logging for debugging
    if (error.response) {
      console.error('API response error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    console.error('Stack trace:', error.stack);
    console.error('================================');
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send email',
      details: 'Check server logs for more details'
    }, { status: 500 });
  }
}
