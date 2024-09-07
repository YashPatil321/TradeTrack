"use client"; // Add this line at the top

import { useEffect, useState } from 'react';

export default function SheetsPage() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/sheets');
        const result = await response.json();
        console.log('Fetched data:', result); // Debugging line
        if (Array.isArray(result)) {
          setData(result);
        } else {
          setError('Data is not an array');
          console.log('Data type:', typeof result); // Debugging line
          console.log('Data content:', result); // Debugging line
        }
      } catch (err) {
        setError('Failed to fetch data');
      }
    }
    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Google Sheets Data</h1>
      <ul>
        {data.map((row, index) => (
          <li key={index}>{row.join(', ')}</li>
        ))}
      </ul>
    </div>
  );
}
