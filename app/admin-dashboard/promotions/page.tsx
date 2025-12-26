"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Promo = {
  code: string;
  description?: string;
  type: 'percent' | 'fixed';
  value: number;
  maxDiscount?: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usageCount?: number;
};

export default function PromotionsAdminPage() {
  const { data: session, status } = useSession();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Promo>({ code: '', description: '', type: 'percent', value: 10, maxDiscount: 0, active: true });
  const [msg, setMsg] = useState('');

  const isAdmin = session?.user?.email === 'yashp.d39@gmail.com';

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/promotions');
      const json = await res.json();
      if (json.success) setPromos(json.data || []);
      else setMsg(json.error || 'Failed to load');
    } catch {
      setMsg('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  const upsert = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const method = promos.find(p => p.code.toUpperCase() === (form.code || '').trim().toUpperCase()) ? 'PUT' : 'POST';
      const res = await fetch('/api/promotions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          type: form.type,
          value: Number(form.value),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          active: form.active,
          startsAt: form.startsAt || undefined,
          endsAt: form.endsAt || undefined,
          usageLimit: form.usageLimit !== undefined && form.usageLimit !== null && form.usageLimit !== ('' as any) ? Number(form.usageLimit) : undefined,
        })
      });
      const json = await res.json();
      if (json.success) {
        setMsg('Saved');
        setForm({ code: '', description: '', type: 'percent', value: 10, maxDiscount: 0, active: true });
        load();
      } else {
        setMsg(json.error || 'Failed to save');
      }
    } catch {
      setMsg('Failed to save');
    }
  };

  const remove = async (code: string) => {
    if (!confirm(`Delete promotion ${code}?`)) return;
    setMsg('');
    try {
      const res = await fetch(`/api/promotions?code=${encodeURIComponent(code)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setMsg('Deleted'); load(); }
      else setMsg(json.error || 'Failed to delete');
    } catch {
      setMsg('Failed to delete');
    }
  };

  if (status === 'loading') return null;
  if (!isAdmin) return <div className="p-6">Admin access required</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Promotions Management</h1>
              <p className="text-gray-600 mt-1">Create and manage discount codes</p>
            </div>
            <a 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
              href="/admin-dashboard/referrals"
            >
              Go to Referrals →
            </a>
          </div>

          {/* Create/Edit Form */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {promos.find(p => p.code.toUpperCase() === (form.code || '').trim().toUpperCase()) ? 'Edit Promotion' : 'Create New Promotion'}
            </h2>
            <form onSubmit={upsert} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Code *</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="e.g., SAVE10" 
                  value={form.code} 
                  onChange={e => setForm({ ...form, code: e.target.value })} 
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Description of the promotion" 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
                <select 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={form.type} 
                  onChange={e => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Value *</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="number" 
                  step="0.01" 
                  placeholder={form.type === 'percent' ? '10' : '25.00'} 
                  value={form.value as any} 
                  onChange={e => setForm({ ...form, value: Number(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Max Discount ($)</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="number" 
                  step="0.01" 
                  placeholder="Optional" 
                  value={(form.maxDiscount as any) ?? ''} 
                  onChange={e => setForm({ ...form, maxDiscount: e.target.value === '' ? undefined : Number(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Starts At</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="datetime-local" 
                  value={form.startsAt || ''} 
                  onChange={e => setForm({ ...form, startsAt: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Ends At</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="datetime-local" 
                  value={form.endsAt || ''} 
                  onChange={e => setForm({ ...form, endsAt: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Usage Limit</label>
                <input 
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="number" 
                  placeholder="Unlimited" 
                  value={(form.usageLimit as any) ?? ''} 
                  onChange={e => setForm({ ...form, usageLimit: e.target.value === '' ? undefined : Number(e.target.value) })} 
                />
              </div>
              <div className="flex items-center">
                <div className="flex items-center h-full pt-6">
                  <label className="inline-flex items-center">
                    <input 
                      id="active" 
                      type="checkbox" 
                      checked={form.active} 
                      onChange={e => setForm({ ...form, active: e.target.checked })}
                      className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">Active</span>
                  </label>
                </div>
              </div>
              <div className="md:col-span-3">
                <button 
                  type="submit" 
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {promos.find(p => p.code.toUpperCase() === (form.code || '').trim().toUpperCase()) ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>

          {msg && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{msg}</p>
            </div>
          )}

          {/* Promotions Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Active Promotions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Discount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-4" colSpan={7}>
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading promotions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : promos.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-center text-gray-500" colSpan={7}>
                        No promotions created yet. Create your first promotion above.
                      </td>
                    </tr>
                  ) : (
                    promos.map(p => (
                      <tr key={p.code} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                          {p.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            p.type === 'percent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {p.type === 'percent' ? 'Percentage' : 'Fixed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {p.type === 'percent' ? `${p.value}%` : `$${p.value}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.maxDiscount ? `$${p.maxDiscount}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            p.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {p.usageCount ?? 0}{typeof p.usageLimit === 'number' ? ` / ${p.usageLimit}` : ' uses'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button 
                            onClick={() => setForm({ ...p })} 
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => remove(p.code)} 
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
