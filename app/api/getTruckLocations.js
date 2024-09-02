import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'C:\Users\yashp\trucktrack\delta-deck-433915-q3-1fca1f2d39ba.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: 'your-spreadsheet-id',
      range: 'Sheet1!A2:C',
    });

    const rows = response.data.values;

    if (rows?.length) {
      const locations = rows.map(row => ({
        name: row[0],
        lat: parseFloat(row[1]),
        lng: parseFloat(row[2]),
      }));
      res.status(200).json(locations);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
