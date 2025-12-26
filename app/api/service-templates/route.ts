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
    // Graceful fallback so UI continues working: curated defaults
    const fallback = [
      // Handyman
      { trade: 'handyman', name: '15AMP Wall Outlet Upgrade Package', description: 'Upgrade 20 outlets to modern 15AMP with USB-A/C. White outlets included.', price: '$500', timeEstimate: '4 hours' },
      { trade: 'handyman', name: 'Kitchen Faucet Replacement', description: 'Remove old and install customer-provided kitchen faucet.', price: '$300', timeEstimate: '3 hours' },
      { trade: 'handyman', name: 'Drywall Patch, Texture & Paint', description: 'Repair 3 drywall patches with texture match and paint touch-up.', price: '$500', timeEstimate: '3 hours' },
      { trade: 'handyman', name: 'House Lock Change Service', description: 'Replace locks/door knobs for up to 10 doors (customer provides locks).', price: '$500', timeEstimate: '5 hours' },
      // Plumbing
      { trade: 'plumbing', name: 'Faucet Repair & Replacement', description: 'Cartridge replacement, seal fixes, or full faucet install.', price: '$85', timeEstimate: '2 hours' },
      { trade: 'plumbing', name: 'Toilet Repair & Installation', description: 'Troubleshoot and repair or replace toilet with new wax ring.', price: '$120', timeEstimate: '3 hours' },
      { trade: 'plumbing', name: 'Drain Cleaning & Unclogging', description: 'Snake and clean kitchen/bath drains or main lines.', price: '$95', timeEstimate: '2 hours' },
      // Electrician
      { trade: 'electrician', name: 'Outlet Installation & Repair', description: 'Install/repair standard, GFCI, or USB outlets.', price: '$95', timeEstimate: '1 hour' },
      { trade: 'electrician', name: 'Light Switch Installation', description: 'Install/replace dimmer, smart, or three-way switches.', price: '$85', timeEstimate: '1 hour' },
      { trade: 'electrician', name: 'Ceiling Fan Installation', description: 'Mount and wire ceiling fan, balance and test.', price: '$120', timeEstimate: '3 hours' },
      // Painting
      { trade: 'painting', name: 'Interior Room Painting', description: 'Prep, prime, and paint interior room with trim.', price: '$180', timeEstimate: '5 hours' },
      { trade: 'painting', name: 'Touch-Up & Repair Painting', description: 'Fill nail holes, minor repairs, and color match touch-ups.', price: '$80', timeEstimate: '1 hour' },
    ];
    return NextResponse.json({ success: true, data: fallback, warning: 'DB unavailable, returning fallback templates' });
  }
}
