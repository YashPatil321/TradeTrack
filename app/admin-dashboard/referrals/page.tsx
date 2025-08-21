"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

type UserRow = {
  email: string;
  name?: string;
  role?: string;
  type?: string;
  referralCode?: string;
  referralEligible?: boolean;
  referralCredits?: number;
  hasBookedBefore?: boolean;
  createdAt?: string;
};

export default function AdminReferralsPage() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [query, setQuery] = useState('');

  const isAdmin = session?.user?.email === 'yashp.d39@gmail.com';

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success) setRows(json.data || []);
      else setMsg(json.error || 'Failed to load users');
    } catch (e) {
      setMsg('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (r.email || '').toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q));
  }, [rows, query]);

  const toggleEligibility = async (email: string, next: boolean) => {
    setMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referralEligible: next })
      });
      const json = await res.json();
      if (json.success) {
        setRows(prev => prev.map(r => r.email === email ? { ...r, referralEligible: next } : r));
      } else {
        setMsg(json.error || 'Failed to update');
      }
    } catch {
      setMsg('Failed to update');
    }
  };

  const sendReferralEmail = async (email: string) => {
    setMsg('');
    try {
      const res = await fetch('/api/referrals/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (json.success) setMsg(`Referral email sent to ${email}`);
      else setMsg(json.error || 'Failed to send email');
    } catch {
      setMsg('Failed to send email');
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
              <h1 className="text-3xl font-bold text-gray-900">Referral Program Management</h1>
              <p className="text-gray-600 mt-1">Manage user eligibility and send referral codes</p>
            </div>
            <a 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
              href="/admin-dashboard/promotions"
            >
              Go to Promotions →
            </a>
          </div>

          <div className="flex gap-4 items-center mb-6">
            <div className="flex-1">
              <input
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by name or email..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={load} 
              className="px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          {msg && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{msg}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eligible</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Code</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-4" colSpan={8}>
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-center text-gray-500" colSpan={8}>
                        {rows.length === 0 ? "No users found. Users will appear here after they log in." : "No users match your search."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(u => {
                      const link = u.referralCode ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?ref=${encodeURIComponent(u.referralCode)}` : '';
                      return (
                        <tr key={u.email} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {u.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {u.role || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {u.type || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <label className="inline-flex items-center">
                              <input 
                                type="checkbox" 
                                checked={!!u.referralEligible} 
                                onChange={e => toggleEligibility(u.email, e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                {u.referralEligible ? (
                                  <span className="text-green-600 font-semibold">Eligible</span>
                                ) : (
                                  <span className="text-gray-500">Not eligible</span>
                                )}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {u.referralCode ? (
                              <div className="space-y-1">
                                <div className="font-bold">{u.referralCode}</div>
                                {link && (
                                  <a 
                                    className="text-blue-600 hover:text-blue-800 underline text-xs" 
                                    href={link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                  >
                                    View link →
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {u.referralCredits ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              onClick={() => sendReferralEmail(u.email)} 
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              Send Email
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">API Endpoints:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="bg-white p-3 rounded border">
                <code className="text-blue-600">/api/admin/users</code>
                <p className="mt-1">GET, PUT - Manage users</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <code className="text-blue-600">/api/referrals/send-email</code>
                <p className="mt-1">POST - Send referral emails</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <a className="text-blue-600 underline" href="/admin-dashboard/promotions">
                  /admin-dashboard/promotions
                </a>
                <p className="mt-1">Promotions management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
