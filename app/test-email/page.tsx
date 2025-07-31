'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSendEmail = async () => {
    if (!email) {
      setStatus('error');
      setMessage('Please enter an email address');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'TradersTap Email Test',
          message: 'This is a test email from TradersTap to verify OAuth2 email functionality.'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Test email sent successfully!');
      } else {
        setStatus('error');
        setMessage(`Failed to send email: ${data.error}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          📧 Email Test Tool
        </h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Recipient Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="test@example.com"
            />
          </div>

          <button
            onClick={handleSendEmail}
            disabled={status === 'loading'}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              status === 'loading'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {status === 'loading' ? 'Sending...' : 'Send Test Email'}
          </button>

          {message && (
            <div className={`p-3 rounded-md ${
              status === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : status === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>This tool tests the OAuth2 email functionality.</p>
          <p>Use this to verify email configuration in production.</p>
        </div>
      </div>
    </div>
  );
}
