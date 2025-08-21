import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // Ensure referral code exists
    if (!user.referralCode) {
      const gen = async () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return `TM-${code}`;
      };
      let code = await gen();
      for (let i = 0; i < 5; i++) {
        const taken = await User.findOne({ referralCode: code });
        if (!taken) break;
        code = await gen();
      }
      user.referralCode = code;
      await user.save();
    }

    // Compose email
    const referralUrl = `${process.env.NEXTAUTH_URL || 'https://tradesmonk.com'}/?ref=${encodeURIComponent(user.referralCode)}`;
    const subject = `Your TradesMonk referral code`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width:640px;margin:0 auto;color:#111;">
        <div style="background:#0f172a;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:22px;">TradesMonk Referral Program</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p>Hi ${user.name || user.email},</p>
          <p>Your referral code is:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:1px;">${user.referralCode}</p>
          <p>Share this link with friends:</p>
          <p><a href="${referralUrl}" style="color:#2563eb;">${referralUrl}</a></p>
          <p>When your friend books their first service using your code, they'll get a discount and you'll earn referral credit.</p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't expect this, you can ignore this email.</p>
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `TradesMonk <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    });

    return NextResponse.json({ success: true, data: { email: user.email, referralCode: user.referralCode } });
  } catch (e) {
    console.error('Referral send email error', e);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
