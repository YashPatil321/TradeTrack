'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import MainNav from '@/components/MainNav';

// Minimal catalog copied from home page to allow checkbox selection
// If you later move this to a shared module, we can import it from lib.
const serviceCategories = [
  {
    id: 'handyman',
    name: 'Handyman Services',
    services: [
      { name: '15AMP Wall Outlet Upgrade Package', description: 'Complete upgrade of 20 wall outlets to modern 15AMP duplex with USB-A and USB-C ports. White outlets provided and installed professionally', price: '$500', timeEstimate: '4 hours' },
      { name: '20AMP Wall Outlet Upgrade Package', description: 'Complete upgrade of 20 wall outlets to modern 20AMP duplex with USB-A and USB-C ports. White outlets provided and installed professionally', price: '$500', timeEstimate: '4 hours' },
      { name: 'Kitchen Faucet Replacement', description: 'Professional kitchen faucet installation and old faucet removal. Customer provides new faucet, we handle all plumbing connections', price: '$300', timeEstimate: '3 hours' },
      { name: 'Angle Valve Replacement Service', description: 'Complete hot and cold angle valve replacement for kitchen sink plus two bathroom vanities. All valves and fittings included', price: '$500', timeEstimate: '3 hours' },
      { name: 'Drywall Patch, Texture & Paint', description: 'Professional repair of 3 drywall patches including texture matching and paint touch-up for seamless wall restoration', price: '$500', timeEstimate: '3 hours' },
      { name: 'Complete Toilet Replacement', description: 'Full toilet replacement service including Home Depot pickup and old toilet disposal. Customer provides new toilet model', price: '$300', timeEstimate: '3 hours' },
      { name: 'Room LED Lighting with Channel', description: 'Premium LED strip lighting installation in ceiling channels for gaming rooms, kids rooms, or offices. Professional channel mounting included', price: '$700', timeEstimate: '6 hours' },
      { name: 'Room LED Lighting (No Channel)', description: 'LED strip lighting installation for gaming rooms, kids rooms, or offices. Direct ceiling mounting without channel system', price: '$300', timeEstimate: '4 hours' },
      { name: 'House Lock Change Service', description: 'Professional lock and door knob replacement for up to 10 doors including closets and bathrooms. Customer provides locks', price: '$500', timeEstimate: '5 hours' },
    ],
  },
  {
    id: 'plumber',
    name: 'Plumbing',
    services: [
      { name: 'Faucet Repair & Replacement', description: 'Complete faucet repair including cartridge replacement, seal fixes, and full faucet installation for kitchen and bathroom sinks', price: '$85', timeEstimate: '2 hours' },
      { name: 'Toilet Repair & Installation', description: 'Toilet troubleshooting, flapper replacement, fill valve repair, complete toilet removal and installation with wax ring', price: '$120', timeEstimate: '3 hours' },
      { name: 'Drain Cleaning & Unclogging', description: 'Professional drain cleaning using snakes and hydro-jetting for kitchen sinks, bathroom drains, and main sewer lines', price: '$95', timeEstimate: '2 hours' },
      { name: 'Pipe Leak Detection & Repair', description: 'Advanced leak detection using specialized equipment, pipe patching, joint repair, and emergency leak stopping', price: '$110', timeEstimate: '3 hours' },
      { name: 'Water Heater Service', description: 'Water heater maintenance, thermostat replacement, heating element repair, and complete tank or tankless installation', price: '$150', timeEstimate: '4 hours' },
      { name: 'Garbage Disposal Installation', description: 'Complete garbage disposal removal and installation including electrical connections, plumbing hookup, and testing', price: '$130', timeEstimate: '3 hours' },
    ],
  },
  {
    id: 'electrician',
    name: 'Electrician Services',
    services: [
      { name: 'Outlet Installation & Repair', description: 'Installation of new electrical outlets, GFCI outlets, USB outlets, and repair of faulty or damaged electrical receptacles', price: '$95', timeEstimate: '1 hour' },
      { name: 'Light Switch Installation', description: 'Installation and replacement of standard switches, dimmer switches, smart switches, and three-way switch configurations', price: '$85', timeEstimate: '1 hour' },
      { name: 'Ceiling Fan Installation', description: 'Complete ceiling fan installation including electrical connections, mounting, balancing, and remote control setup', price: '$120', timeEstimate: '3 hours' },
      { name: 'Light Fixture Replacement', description: 'Installation of chandeliers, pendant lights, recessed lighting, wall sconces, and outdoor security lighting', price: '$100', timeEstimate: '1 hour' },
      { name: 'Circuit Breaker Repair', description: 'Troubleshooting electrical panel issues, circuit breaker replacement, and electrical safety inspections', price: '$130', timeEstimate: '2 hours' },
      { name: 'Electrical Wiring Repair', description: 'Repair of damaged wiring, wire splicing, electrical code compliance updates, and safety hazard elimination', price: '$110', timeEstimate: '3 hours' },
      { name: 'Smart Home Device Installation', description: 'Installation of smart thermostats, smart doorbells, security cameras, and home automation electrical components', price: '$140', timeEstimate: '2 hours' },
    ],
  },
  {
    id: 'painter',
    name: 'Painting Services',
    services: [
      { name: 'Interior Room Painting', description: 'Complete interior room painting including wall preparation, primer application, two coats of premium paint, and trim work', price: '$180', timeEstimate: '5 hours' },
      { name: 'Exterior House Painting', description: 'Professional exterior painting with pressure washing, surface prep, weather-resistant paint, and protective coating application', price: '$220', timeEstimate: '7 hours' },
      { name: 'Cabinet Painting & Refinishing', description: 'Kitchen and bathroom cabinet refinishing with sanding, priming, spray painting, and new hardware installation', price: '$160', timeEstimate: '6 hours' },
      { name: 'Deck & Fence Staining', description: 'Deck and fence restoration with power washing, wood conditioning, stain application, and weatherproof sealing', price: '$140', timeEstimate: '5 hours' },
      { name: 'Accent Wall & Feature Painting', description: 'Specialty accent wall painting, textured finishes, color consultation, and decorative painting techniques', price: '$120', timeEstimate: '3 hours' },
      { name: 'Ceiling Painting', description: 'Professional ceiling painting with proper equipment, stain blocking primer, and smooth finish application', price: '$100', timeEstimate: '2 hours' },
      { name: 'Touch-Up & Repair Painting', description: 'Paint touch-ups, nail hole filling, minor wall repairs, and color matching for seamless wall restoration', price: '$80', timeEstimate: '1 hour' },
    ],
  },
] as const;

type TradeId = typeof serviceCategories[number]['id'];

export default function ProviderInputPage() {
  const { data: session, status } = useSession();

  const [form, setForm] = useState({
    name: '',
    description: '',
    hours: 'Monday–Friday 9AM–5PM',
    mainLocation: '',
    trade: 'handyman' as TradeId,
    imageDataUrl: '',
    imageUrl: '',
    phoneNumber: '',
    contactEmail: '',
  });

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [serviceTemplates, setServiceTemplates] = useState<any[]>([]);

  const currentCategory = useMemo(() => serviceCategories.find(c => c.id === form.trade)!, [form.trade]);
  // Map UI category id -> template trade key
  const idToTrade: Record<string, string> = { handyman: 'handyman', plumber: 'plumbing', electrician: 'electrician', painter: 'painting' };
  const getMergedServices = (categoryId: string) => {
    const base = serviceCategories.find(c => c.id === categoryId)?.services || [];
    const trade = idToTrade[categoryId];
    const fromDb = serviceTemplates
      .filter((t) => t.trade === trade)
      .map((t) => ({ name: t.name, description: t.description, price: t.price, timeEstimate: t.timeEstimate }));
    return [...base, ...fromDb];
  };
  const mergedServices = useMemo(() => getMergedServices(form.trade), [serviceTemplates, form.trade]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/service-templates');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) setServiceTemplates(json.data);
      } catch (e) {
        console.error('Failed to load service templates', e);
      }
    };
    fetchTemplates();
  }, []);

  const onDrop = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm(prev => ({ ...prev, imageDataUrl: result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = () => setForm(prev => ({ ...prev, imageDataUrl: '' }));

  const toggleService = (name: string) => {
    setSelected(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const parseRate = (price: string) => {
    const n = parseFloat(price.replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!form.name || !form.description || !form.mainLocation || !form.trade) {
        throw new Error('Please fill all required fields');
      }
      const chosen = mergedServices.filter(s => selected[s.name]);
      if (chosen.length === 0) {
        throw new Error('Please select at least one service');
      }
      if (!form.imageUrl && !form.imageDataUrl) {
        throw new Error('Please provide an image URL or upload an image');
      }
      if (status === 'unauthenticated') {
        throw new Error('Please sign in to save a provider');
      }

      // Canonicalize trade for API/model enum
      const tradeMap: Record<string, string> = { plumbing: 'plumber', painting: 'painter', handyman: 'handyman', electrician: 'electrician' };
      const canonicalTrade = tradeMap[form.trade] || form.trade;

      // Map checked services to schema shape (already validated non-empty)
      const servicesPayload = chosen.map(s => ({
        service: s.name,
        category: canonicalTrade,
        rate: parseRate(s.price),
        timeLimit: s.timeEstimate,
        description: s.description,
        materials: [],
      }));

      const body = {
        name: form.name,
        description: form.description,
        image: form.imageUrl || form.imageDataUrl || '',
        hours: form.hours,
        mainLocation: form.mainLocation,
        trade: canonicalTrade,
        phoneNumber: form.phoneNumber,
        contactEmail: form.contactEmail,
        // Keep DB-compatible fields
        location: { type: 'Point', coordinates: [0, 0] },
        schedule: [],
        services: servicesPayload,
      };

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save provider');

      setMessage('Provider saved successfully');
      setForm({ name: '', description: '', hours: 'Monday–Friday 9AM–5PM', mainLocation: '', trade: 'handyman', imageDataUrl: '', imageUrl: '', phoneNumber: '', contactEmail: '' });
      setSelected({});
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5e6d3' }}>
      <MainNav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">Provider Input</h1>

        {status === 'unauthenticated' && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 p-4 rounded mb-6">
            <p className="mb-2">You must be logged in to add providers.</p>
            <button onClick={() => signIn('google')} className="bg-black text-white px-4 py-2 rounded">Sign in with Google</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Provider Name *</label>
              <input className="w-full border border-gray-300 rounded p-2 text-black" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Trade *</label>
              <select className="w-full border border-gray-300 rounded p-2 text-black bg-white" value={form.trade} onChange={e => setForm(p => ({ ...p, trade: e.target.value as TradeId }))}>
                {serviceCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-black mb-1">Description *</label>
              <textarea className="w-full border border-gray-300 rounded p-2 text-black" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Business Hours *</label>
              <input className="w-full border border-gray-300 rounded p-2 text-black" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} placeholder="Monday–Friday 9AM–5PM" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Main Address *</label>
              <input className="w-full border border-gray-300 rounded p-2 text-black" value={form.mainLocation} onChange={e => setForm(p => ({ ...p, mainLocation: e.target.value }))} placeholder="Rancho Bernardo, CA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Phone Number</label>
              <input className="w-full border border-gray-300 rounded p-2 text-black" value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Contact Email</label>
              <input type="email" className="w-full border border-gray-300 rounded p-2 text-black" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="provider@example.com" />
            </div>
          </div>

          {/* Image: URL or Drag-and-drop */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Provider Image</label>
            <div className="mb-3">
              <label className="block text-sm text-black mb-1">Image URL (preferred)</label>
              <input className="w-full border border-gray-300 rounded p-2 text-black" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://images.unsplash.com/..." />
              <p className="text-xs text-gray-600 mt-1">If provided, this will be used instead of the uploaded image.</p>
            </div>
            {!form.imageDataUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 text-black"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
              >
                <p className="mb-3">Drag & drop an image here, or click to select</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onDrop(e.target.files)}
                  className="mx-auto block"
                />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <img src={form.imageDataUrl} alt="preview" className="w-32 h-32 object-cover rounded" />
                <button type="button" onClick={removeImage} className="text-red-600 hover:underline">Remove</button>
              </div>
            )}
          </div>

          {/* Services checklist (filtered by trade) */}
          <div>
            <h2 className="text-lg font-semibold text-black mb-2">Select Services Offered</h2>
            <p className="text-sm text-gray-600 mb-3">Choose from the {currentCategory.name} list.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-auto pr-2">
              {mergedServices.map((svc) => (
                <label key={svc.name} className="flex items-start gap-2 p-2 border rounded">
                  <input type="checkbox" className="mt-1" checked={!!selected[svc.name]} onChange={() => toggleService(svc.name)} />
                  <div>
                    <div className="font-medium text-black">{svc.name}</div>
                    <div className="text-xs text-gray-600">{svc.description}</div>
                    <div className="text-xs text-gray-700 mt-1">Price: {svc.price} • Time: {svc.timeEstimate}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">{error}</div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">{message}</div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={submitting || status === 'unauthenticated'} className="bg-black text-white px-6 py-3 rounded disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
