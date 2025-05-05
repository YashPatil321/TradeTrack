'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EmailTestPage() {
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Email from TradeTrack',
    message: 'This is a test email from the TradeTrack application.'
  });
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [apiResponse, setApiResponse] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending email...' });

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setApiResponse(data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setStatus({ 
        type: 'success', 
        message: `Email sent successfully to ${formData.to}! Message ID: ${data.messageId}` 
      });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send email'
      });
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Email Testing Tool</h1>
          <p className="text-gray-600 mb-4">
            Send test emails directly using the Gmail API
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                Recipient Email Address
              </label>
              <input
                type="email"
                name="to"
                id="to"
                required
                value={formData.to}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="recipient@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Test Email Subject"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message (HTML supported)
              </label>
              <textarea
                name="message"
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your email message here..."
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={status.type === 'loading'}
                className={`px-6 py-2 rounded-md text-white font-medium ${status.type === 'loading'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {status.type === 'loading' ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>

        {status.type !== 'idle' && (
          <div className={`p-6 rounded-lg shadow-md ${status.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : status.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <h2 className="text-xl font-bold mb-2">
              {status.type === 'loading' ? 'Sending Email...'
                : status.type === 'success' ? 'Success!'
                  : 'Error'}
            </h2>
            <p className="mb-4">{status.message}</p>

            {apiResponse && (
              <div className="mt-4">
                <h3 className="font-bold text-gray-700 mb-2">API Response</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm max-h-48 overflow-y-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}

            {status.type === 'error' && (
              <div className="mt-4 text-red-700">
                <p className="font-bold">Troubleshooting Tips:</p>
                <ul className="list-disc ml-5 mt-2">
                  <li>Verify your Gmail API is enabled in Google Cloud Console</li>
                  <li>Check that your OAuth consent screen includes the Gmail API scope</li>
                  <li>Confirm that your refresh token is valid and not expired</li>
                  <li>Make sure your OAuth client has <code>https://developers.google.com/oauthplayground</code> as a redirect URI</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">About Email Configuration</h2>
          <p className="mb-4">
            This application uses Gmail API directly with OAuth to send emails. Your <code>.env</code> file
            needs these settings:
          </p>
          <ul className="list-disc ml-5 mb-4">
            <li><code>EMAIL_USER</code> - Your Gmail address (the sender)</li>
            <li><code>EMAIL_CLIENT_ID</code> - Your Gmail API Client ID</li>
            <li><code>EMAIL_CLIENT_SECRET</code> - Your Gmail API Client Secret</li>
            <li><code>GOOGLE_REFRESH_TOKEN</code> - Your Gmail API Refresh Token</li>
          </ul>
          <p className="mb-2">
            <strong>Important:</strong> You must add <code>https://developers.google.com/oauthplayground</code> as an authorized redirect URI
            in your Google Cloud OAuth client settings.          
          </p>
          <p>
            The Gmail API method sends emails with black text per your preference and should be more reliable than nodemailer.
          </p>
        </div>
      </div>
    </div>
  );
}
