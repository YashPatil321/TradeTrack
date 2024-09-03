import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import path from 'path';

const auth = new GoogleAuth({
  keyFile: path.join(process.cwd(), 'keys\delta-deck-433915-q3-836655bfc365.json'), // Update this path
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const service = google.sheets({ version: 'v4', auth });

export async function getValues(spreadsheetId: string, range: string): Promise<any[]> {
  try {
    const result = await service.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const numRows = result.data.values ? result.data.values.length : 0;
    console.log(`${numRows} rows retrieved.`);
    return result.data.values || [];
  } catch (err) {
    console.error('Error fetching data from Google Sheets:', err);
    throw err;
  }
}
