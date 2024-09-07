import { useEffect, useState } from 'react';

export default function SheetsPage() {
  const [data, setData] = useState<string[][]>([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/sheets');
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, []);

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
