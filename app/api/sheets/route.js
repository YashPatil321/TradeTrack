import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Initialize the sheet - doc ID is the long id in the sheets URL
const doc = new GoogleSpreadsheet('<your-sheet-id>');

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });

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
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data from Google Sheets' }, { status: 500 });
  }
}
