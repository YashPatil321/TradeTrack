import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Initialize the sheet - replace <your-sheet-id> with your actual Google Sheets ID
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

async function accessSpreadsheet() {
  // Load the credentials from the environment variables
  const creds = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  // Authenticate with the Google Sheets API
  await doc.useServiceAccountAuth(creds);

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // Index of sheet
  const rows = await sheet.getRows(); // Fetch rows from sheet

  const data = rows.map(row => row._rawData); // Return raw data
  console.log('Fetched rows:', data); // Debugging line
  return data;
}

export async function GET() {
  try {
    const data = await accessSpreadsheet();
    console.log('API Response:', data); // Debugging line
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error); // Debugging line
    return NextResponse.json({ error: 'Failed to fetch data from Google Sheets' }, { status: 500 });
  }
}
