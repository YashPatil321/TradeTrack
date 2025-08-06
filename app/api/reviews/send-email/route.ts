import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface ReviewEmailRequest {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  serviceType: string;
  providerName: string;
  providerEmail?: string;
  bookingDate: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      customerEmail,
      customerName,
      bookingId,
      serviceName,
      serviceType,
      providerName,
      providerEmail,
      bookingDate
    }: ReviewEmailRequest = await request.json();

    // Validate required fields
    if (!customerEmail || !customerName || !bookingId || !serviceName || !providerName) {
      return NextResponse.json(
        { error: 'Missing required fields for review email' },
        { status: 400 }
      );
    }

    // Create review link with booking details
    const reviewUrl = `${process.env.NEXTAUTH_URL}/reviews/submit?` +
      `bookingId=${encodeURIComponent(bookingId)}` +
      `&customerEmail=${encodeURIComponent(customerEmail)}` +
      `&customerName=${encodeURIComponent(customerName)}` +
      `&serviceName=${encodeURIComponent(serviceName)}` +
      `&serviceType=${encodeURIComponent(serviceType)}` +
      `&providerName=${encodeURIComponent(providerName)}` +
      `&bookingDate=${encodeURIComponent(bookingDate)}`;

    // Create email content
    const emailSubject = `How was your ${serviceName} service with TradesMonk?`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TradesMonk</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">We'd love your feedback!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Thank you for choosing TradesMonk for your recent <strong>${serviceName}</strong> service with <strong>${providerName}</strong> on ${new Date(bookingDate).toLocaleDateString()}.
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Your feedback helps us maintain quality service and helps other customers make informed decisions. It only takes 2 minutes!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                      transition: all 0.3s ease;">
              ⭐ Leave Your Review
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; font-size: 18px;">Your Service Details:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Service:</strong> ${serviceName}</li>
              <li><strong>Provider:</strong> ${providerName}</li>
              <li><strong>Date:</strong> ${new Date(bookingDate).toLocaleDateString()}</li>
              <li><strong>Booking ID:</strong> ${bookingId}</li>
            </ul>
          </div>
          
          <p style="color: #777; font-size: 14px; line-height: 1.6;">
            Your review will be publicly visible to help other customers. If you experienced any issues, 
            please also contact us directly at <a href="mailto:support@tradesmonk.com" style="color: #667eea;">support@tradesmonk.com</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent because you recently completed a service booking with TradesMonk.<br>
            If you believe this was sent in error, please contact us at support@tradesmonk.com
          </p>
        </div>
      </div>
    `;

    // Send email using the existing email configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TradesMonk Reviews" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: emailSubject,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Review email sent successfully',
      reviewUrl 
    });

  } catch (error) {
    console.error('Error sending review email:', error);
    return NextResponse.json(
      { error: 'Failed to send review email' },
      { status: 500 }
    );
  }
}
