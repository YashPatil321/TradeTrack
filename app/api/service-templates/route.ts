import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import ServiceTemplate from '@/models/ServiceTemplate';

// Create a new service template
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const { trade, name, description, price, timeEstimate } = body || {};
    const ALLOWED = ['handyman', 'plumbing', 'electrician', 'painting'];

    if (!trade || !ALLOWED.includes(trade)) {
      return NextResponse.json({ error: `Invalid trade. Must be one of: ${ALLOWED.join(', ')}` }, { status: 400 });
    }
    if (!name || !description || !price || !timeEstimate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tpl = await ServiceTemplate.create({
      trade,
      name,
      description,
      price,
      timeEstimate,
      createdBy: session.user.email,
    });
    return NextResponse.json({ success: true, data: tpl }, { status: 201 });
  } catch (err: any) {
    console.error('ServiceTemplate POST error:', err);
    return NextResponse.json({ error: 'Failed to create service template' }, { status: 500 });
  }
}

// Bulk upsert service templates
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const items: any[] = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    const ALLOWED = ['handyman', 'plumbing', 'electrician', 'painting'];
    const ops = items.map((it) => {
      const { _id, trade, name, description, price, timeEstimate } = it || {};
      if (!trade || !ALLOWED.includes(trade) || !name || !description || !price || !timeEstimate) {
        throw new Error('Invalid item payload');
      }
      const doc = { trade, name, description, price, timeEstimate, createdBy: session.user!.email! };
      if (_id) return ServiceTemplate.findByIdAndUpdate(_id, doc, { new: true });
      return ServiceTemplate.create(doc);
    });

    const results = await Promise.all(ops);
    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    console.error('ServiceTemplate PUT error:', err);
    return NextResponse.json({ error: 'Failed to upsert service templates' }, { status: 500 });
  }
}

// Bulk delete by IDs
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
    await ServiceTemplate.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('ServiceTemplate DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete service templates' }, { status: 500 });
  }
}

// List service templates (optionally by trade)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const trade = url.searchParams.get('trade');
    const query: any = {};
    if (trade) query.trade = trade;
    const items = await ServiceTemplate.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (err: any) {
    console.error('ServiceTemplate GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch service templates' }, { status: 500 });
  }
}
