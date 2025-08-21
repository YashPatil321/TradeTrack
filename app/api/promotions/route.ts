import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Promotion from '@/models/Promotion';

function normalizeCode(code: string) {
  return (code || '').trim().toUpperCase();
}

function isActive(p: any) {
  const now = new Date();
  if (p.active === false) return false;
  if (p.startsAt && new Date(p.startsAt) > now) return false;
  if (p.endsAt && new Date(p.endsAt) < now) return false;
  if (typeof p.usageLimit === 'number' && typeof p.usageCount === 'number' && p.usageLimit >= 0) {
    if (p.usageCount >= p.usageLimit) return false;
  }
  return true;
}

function applyDiscount(p: any, amount: number) {
  const base = Math.max(0, amount || 0);
  let discount = 0;
  if (p.type === 'percent') {
    discount = (base * (p.value || 0)) / 100;
    if (p.maxDiscount && discount > p.maxDiscount) discount = p.maxDiscount;
  } else if (p.type === 'fixed') {
    discount = Math.min(base, p.value || 0);
  }
  const final = Math.max(0, +(base - discount).toFixed(2));
  return { discount: +discount.toFixed(2), final };
}

// GET: list promotions or validate a code
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const validateCode = searchParams.get('validate');
    const amountParam = searchParams.get('amount');

    if (validateCode) {
      const code = normalizeCode(validateCode);
      const promo = await Promotion.findOne({ code });
      if (!promo) return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 404 });
      if (!isActive(promo)) return NextResponse.json({ success: false, error: 'Code not active' }, { status: 400 });
      const amount = amountParam ? parseFloat(amountParam) : 0;
      const { discount, final } = applyDiscount(promo, amount);
      return NextResponse.json({ success: true, data: { code: promo.code, type: promo.type, value: promo.value, maxDiscount: promo.maxDiscount || null, discount, final } });
    }

    // Admin list
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    const promos = await Promotion.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: promos });
  } catch (e) {
    console.error('Promotions GET error', e);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// POST: create promotion (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    await dbConnect();
    const body = await req.json();
    const code = normalizeCode(body.code);
    if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 });
    const doc = await Promotion.create({
      code,
      description: body.description || '',
      type: body.type,
      value: body.value,
      maxDiscount: body.maxDiscount || undefined,
      active: body.active !== false,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      usageLimit: typeof body.usageLimit === 'number' ? body.usageLimit : undefined,
    });
    return NextResponse.json({ success: true, data: doc });
  } catch (e: any) {
    console.error('Promotions POST error', e);
    const dup = e?.code === 11000;
    return NextResponse.json({ success: false, error: dup ? 'Code already exists' : 'Failed to create' }, { status: dup ? 409 : 500 });
  }
}

// PUT: update promotion (admin)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    await dbConnect();
    const body = await req.json();
    const code = normalizeCode(body.code);
    if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 });

    const update: any = {
      description: body.description,
      type: body.type,
      value: body.value,
      maxDiscount: body.maxDiscount,
      active: body.active,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      usageLimit: typeof body.usageLimit === 'number' ? body.usageLimit : undefined,
      updatedAt: new Date(),
    };

    const doc = await Promotion.findOneAndUpdate({ code }, update, { new: true });
    if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: doc });
  } catch (e) {
    console.error('Promotions PUT error', e);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: delete promotion (admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const code = normalizeCode(searchParams.get('code') || '');
    if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 });
    const res = await Promotion.findOneAndDelete({ code });
    if (!res) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Promotions DELETE error', e);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
