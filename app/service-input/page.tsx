'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import MainNav from '@/components/MainNav';

type Trade = 'handyman' | 'plumbing' | 'electrician' | 'painting';
type Row = { _id?: string; trade: Trade; name: string; description: string; price: string; timeEstimate: string };

const TRADE_OPTIONS: { id: Trade; label: string }[] = [
  { id: 'handyman', label: 'Handyman' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'painting', label: 'Painting' },
];

// Default hardcoded catalog to migrate into Mongo
const DEFAULTS: Record<Trade, Omit<Row, '_id'>[]> = {
  handyman: [
    { trade: 'handyman', name: '15AMP Wall Outlet Upgrade Package', description: 'Complete upgrade of 20 wall outlets to modern 15AMP duplex with USB-A and USB-C ports. White outlets provided and installed professionally', price: '$500', timeEstimate: '4 hours' },
    { trade: 'handyman', name: 'Kitchen Faucet Replacement', description: 'Professional kitchen faucet installation and old faucet removal. Customer provides new faucet, we handle all plumbing connections', price: '$300', timeEstimate: '3 hours' },
    { trade: 'handyman', name: 'Angle Valve Replacement Service', description: 'Complete hot and cold angle valve replacement for kitchen sink plus two bathroom vanities. All valves and fittings included', price: '$500', timeEstimate: '3 hours' },
    { trade: 'handyman', name: 'Drywall Patch, Texture & Paint', description: 'Professional repair of 3 drywall patches including texture matching and paint touch-up for seamless wall restoration', price: '$500', timeEstimate: '3 hours' },
    { trade: 'handyman', name: 'Complete Toilet Replacement', description: 'Full toilet replacement service including Home Depot pickup and old toilet disposal. Customer provides new toilet model', price: '$300', timeEstimate: '3 hours' },
    { trade: 'handyman', name: 'Room LED Lighting with Channel', description: 'Premium LED strip lighting installation in ceiling channels for gaming rooms, kids rooms, or offices. Professional channel mounting included', price: '$700', timeEstimate: '6 hours' },
    { trade: 'handyman', name: 'Room LED Lighting (No Channel)', description: 'LED strip lighting installation for gaming rooms, kids rooms, or offices. Direct ceiling mounting without channel system', price: '$300', timeEstimate: '4 hours' },
    { trade: 'handyman', name: 'House Lock Change Service', description: 'Professional lock and door knob replacement for up to 10 doors including closets and bathrooms. Customer provides locks', price: '$500', timeEstimate: '5 hours' },
  ],
  plumbing: [
    { trade: 'plumbing', name: 'Faucet Repair & Replacement', description: 'Complete faucet repair including cartridge replacement, seal fixes, and full faucet installation for kitchen and bathroom sinks', price: '$85', timeEstimate: '2 hours' },
    { trade: 'plumbing', name: 'Toilet Repair & Installation', description: 'Toilet troubleshooting, flapper replacement, fill valve repair, complete toilet removal and installation with wax ring', price: '$120', timeEstimate: '3 hours' },
    { trade: 'plumbing', name: 'Drain Cleaning & Unclogging', description: 'Professional drain cleaning using snakes and hydro-jetting for kitchen sinks, bathroom drains, and main sewer lines', price: '$95', timeEstimate: '2 hours' },
    { trade: 'plumbing', name: 'Pipe Leak Detection & Repair', description: 'Advanced leak detection using specialized equipment, pipe patching, joint repair, and emergency leak stopping', price: '$110', timeEstimate: '3 hours' },
    { trade: 'plumbing', name: 'Water Heater Service', description: 'Water heater maintenance, thermostat replacement, heating element repair, and complete tank or tankless installation', price: '$150', timeEstimate: '4 hours' },
    { trade: 'plumbing', name: 'Garbage Disposal Installation', description: 'Complete garbage disposal removal and installation including electrical connections, plumbing hookup, and testing', price: '$130', timeEstimate: '3 hours' },
  ],
  electrician: [
    { trade: 'electrician', name: 'Outlet Installation & Repair', description: 'Installation of new electrical outlets, GFCI outlets, USB outlets, and repair of faulty or damaged electrical receptacles', price: '$95', timeEstimate: '1 hour' },
    { trade: 'electrician', name: 'Light Switch Installation', description: 'Installation and replacement of standard switches, dimmer switches, smart switches, and three-way switch configurations', price: '$85', timeEstimate: '1 hour' },
    { trade: 'electrician', name: 'Ceiling Fan Installation', description: 'Complete ceiling fan installation including electrical connections, mounting, balancing, and remote control setup', price: '$120', timeEstimate: '3 hours' },
    { trade: 'electrician', name: 'Light Fixture Replacement', description: 'Installation of chandeliers, pendant lights, recessed lighting, wall sconces, and outdoor security lighting', price: '$100', timeEstimate: '1 hour' },
    { trade: 'electrician', name: 'Circuit Breaker Repair', description: 'Troubleshooting electrical panel issues, circuit breaker replacement, and electrical safety inspections', price: '$130', timeEstimate: '2 hours' },
    { trade: 'electrician', name: 'Electrical Wiring Repair', description: 'Repair of damaged wiring, wire splicing, electrical code compliance updates, and safety hazard elimination', price: '$110', timeEstimate: '3 hours' },
    { trade: 'electrician', name: 'Smart Home Device Installation', description: 'Installation of smart thermostats, smart doorbells, security cameras, and home automation electrical components', price: '$140', timeEstimate: '2 hours' },
  ],
  painting: [
    { trade: 'painting', name: 'Interior Room Painting', description: 'Complete interior room painting including wall preparation, primer application, two coats of premium paint, and trim work', price: '$180', timeEstimate: '5 hours' },
    { trade: 'painting', name: 'Exterior House Painting', description: 'Professional exterior painting with pressure washing, surface prep, weather-resistant paint, and protective coating application', price: '$220', timeEstimate: '7 hours' },
    { trade: 'painting', name: 'Cabinet Painting & Refinishing', description: 'Kitchen and bathroom cabinet refinishing with sanding, priming, spray painting, and new hardware installation', price: '$160', timeEstimate: '6 hours' },
    { trade: 'painting', name: 'Deck & Fence Staining', description: 'Deck and fence restoration with power washing, wood conditioning, stain application, and weatherproof sealing', price: '$140', timeEstimate: '5 hours' },
    { trade: 'painting', name: 'Accent Wall & Feature Painting', description: 'Specialty accent wall painting, textured finishes, color consultation, and decorative painting techniques', price: '$120', timeEstimate: '3 hours' },
    { trade: 'painting', name: 'Ceiling Painting', description: 'Professional ceiling painting with proper equipment, stain blocking primer, and smooth finish application', price: '$100', timeEstimate: '2 hours' },
    { trade: 'painting', name: 'Touch-Up & Repair Painting', description: 'Paint touch-ups, nail hole filling, minor wall repairs, and color matching for seamless wall restoration', price: '$80', timeEstimate: '1 hour' },
  ],
};

export default function ServiceInputPage() {
  const { status } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [filterTrade, setFilterTrade] = useState<Trade | 'all'>('all');
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/service-templates');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setRows(json.data);
        } else {
          throw new Error(json?.error || 'Failed to load templates');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => rows.filter(r => filterTrade === 'all' ? true : r.trade === filterTrade), [rows, filterTrade]);

  const addRow = () => setRows(r => [...r, { trade: 'handyman', name: '', description: '', price: '', timeEstimate: '' }]);
  const updateRow = (idx: number, key: keyof Row, value: any) => setRows(r => r.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  const removeRow = (idx: number) => setRows(r => {
    const target = r[idx];
    if (target?._id) setDeletedIds(ids => [...ids, target._id!]);
    return r.filter((_, i) => i !== idx);
  });

  const saveAll = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      // Basic validation
      const invalid = rows.find(r => !r.trade || !r.name || !r.description || !r.price || !r.timeEstimate);
      if (invalid) throw new Error('All rows must have trade, name, description, price, and time estimate');

      // If there are deletions, perform them first so PUT reflects final set
      if (deletedIds.length > 0) {
        const delRes = await fetch('/api/service-templates', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: deletedIds }),
        });
        const delJson = await delRes.json();
        if (!delRes.ok) throw new Error(delJson?.error || 'Failed to delete some templates');
      }

      const res = await fetch('/api/service-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save');
      setMessage('Templates saved');
      // refresh
      setRows(json.data);
      setDeletedIds([]);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    // For simplicity, delete filtered rows that are empty or explicitly selected via checkbox can be added later; here, delete rows with _id that user removed from table
    try {
      const toDelete = rows.filter(r => r._id === undefined);
      // No-op; we are using removeRow for local deletions
    } catch {}
  };

  const importDefaults = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      // Build list of defaults that are not already present by (trade,name)
      const existingKeys = new Set(rows.map(r => `${r.trade}||${r.name}`));
      const additions: Omit<Row, '_id'>[] = [];
      (Object.keys(DEFAULTS) as Trade[]).forEach(tr => {
        DEFAULTS[tr].forEach(item => {
          const key = `${item.trade}||${item.name}`;
          if (!existingKeys.has(key)) additions.push(item);
        });
      });
      if (!additions.length) {
        setMessage('All defaults already imported');
        setSaving(false);
        return;
      }
      const res = await fetch('/api/service-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: additions }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to import defaults');
      setRows(prev => [...prev, ...json.data]);
      setMessage('Defaults imported');
    } catch (e: any) {
      setError(e.message || 'Failed to import');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5e6d3' }}>
      <MainNav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-black">Service Templates</h1>
          {status === 'unauthenticated' && (
            <button onClick={() => signIn('google')} className="bg-black text-white px-4 py-2 rounded">Sign in with Google</button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Filter</label>
              <select className="border border-gray-300 rounded p-2 text-black bg-white" value={filterTrade} onChange={e => setFilterTrade(e.target.value as any)}>
                <option value="all">All</option>
                {TRADE_OPTIONS.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addRow} className="px-3 py-2 rounded bg-gray-100 border border-gray-300 text-sm">+ Add Row</button>
              <button onClick={importDefaults} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Import Defaults</button>
              <button onClick={saveAll} disabled={saving || status === 'unauthenticated'} className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>

          {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm">{error}</div>}
          {message && <div className="mb-3 bg-green-50 border border-green-200 text-green-700 p-2 rounded text-sm">{message}</div>}

          {loading ? (
            <div className="py-10 text-center text-gray-600">Loading…</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 text-xs font-semibold text-gray-700 border-b">Trade</th>
                    <th className="text-left p-2 text-xs font-semibold text-gray-700 border-b">Name</th>
                    <th className="text-left p-2 text-xs font-semibold text-gray-700 border-b">Description</th>
                    <th className="text-left p-2 text-xs font-semibold text-gray-700 border-b">Price</th>
                    <th className="text-left p-2 text-xs font-semibold text-gray-700 border-b">Time</th>
                    <th className="text-left p-2 text-xs font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, visIdx) => {
                    const idx = rows.indexOf(row);
                    return (
                      <tr key={(row._id || 'new') + '-' + idx} className="align-top">
                        <td className="p-2 border-b">
                          <select className="w-full border border-gray-300 rounded p-2 text-black bg-white"
                                  value={row.trade}
                                  onChange={e => updateRow(idx, 'trade', e.target.value as Trade)}>
                            {TRADE_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </td>
                        <td className="p-2 border-b">
                          <input className="w-full border border-gray-300 rounded p-2 text-black"
                                 value={row.name}
                                 onChange={e => updateRow(idx, 'name', e.target.value)} />
                        </td>
                        <td className="p-2 border-b min-w-[360px]">
                          <textarea className="w-full border border-gray-300 rounded p-2 text-black" rows={2}
                                    value={row.description}
                                    onChange={e => updateRow(idx, 'description', e.target.value)} />
                        </td>
                        <td className="p-2 border-b">
                          <input className="w-full border border-gray-300 rounded p-2 text-black" placeholder="$500"
                                 value={row.price}
                                 onChange={e => updateRow(idx, 'price', e.target.value)} />
                        </td>
                        <td className="p-2 border-b">
                          <input className="w-full border border-gray-300 rounded p-2 text-black" placeholder="3 hours"
                                 value={row.timeEstimate}
                                 onChange={e => updateRow(idx, 'timeEstimate', e.target.value)} />
                        </td>
                        <td className="p-2 border-b">
                          <button onClick={() => removeRow(idx)} className="text-red-600 text-sm">Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
