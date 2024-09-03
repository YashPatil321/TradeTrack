"use client";

import { useEffect, useState } from 'react';

const GoogleSheetsDataPage = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const spreadsheetId = '1g4ceACw8_xPbDzvk5mbIBLr6hu6KWeSxO_qsogXISEM'; // Update this ID
      const range = 'Sheet1!A1:D2'; // Update this range as needed

      try {
        const response = await fetch(`/api/googleSheetsData?spreadsheetId=${spreadsheetId}&range=${range}`);
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Google Sheets Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default GoogleSheetsDataPage;
